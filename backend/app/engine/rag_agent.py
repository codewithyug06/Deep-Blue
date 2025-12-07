import os
import re
import json
from dotenv import load_dotenv

# Modern LangChain Imports
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_chroma import Chroma
# FIXED IMPORT: Use langchain_core instead of langchain.docstore
from langchain_core.documents import Document

# Load API Keys
load_dotenv()

# Base Socratic Personality Definition
BASE_SYSTEM_PROMPT = """
You are 'Deep Blue', a Socratic Coding Tutor, guiding a student through complex cyber raids using Python.
Your communication must match the current mission's active role.

RULES:
1. NEVER give the full code solution. Focus on guided discovery.
2. Keep your responses short (under 3 sentences).
3. Be encouraging and maintain the "futuristic combat/programming" tone.
4. If the student's code is empty or syntactically correct but doesn't solve the mission, refer to the MISSION OBJECTIVE.
5. Use the provided 'Context from Past Performance' to personalize your advice if relevant.
"""

class SocraticAI:
    def __init__(self):
        # 1. Initialize the Google Brain
        if not os.getenv("GOOGLE_API_KEY"):
            raise ValueError("GOOGLE_API_KEY not found in .env file")

        # LLM for Chat
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-preview-09-2025", 
            temperature=0.5
        )
        
        # LLM for Logic/Generation tasks (Deterministic)
        self.logic_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-preview-09-2025", 
            temperature=0.1
        )

        # 2. Vector Database Integration (The "Memory")
        # Wrapped in try/except to handle initialization failures gracefully
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
            self.vector_db = Chroma(
                collection_name="deepblue_knowledge",
                embedding_function=self.embeddings,
                persist_directory="./chroma_db"
            )
            self.memory_active = True
        except Exception as e:
            print(f"⚠️ Vector DB Initialization Failed: {e}")
            self.memory_active = False

        # 3. Define the Prompt Template (Dynamic System Prompt)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}"), 
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])

        # 4. Create the Chain
        self.chain = self.prompt | self.llm | StrOutputParser()

        # 5. Memory Management
        self.store = {} 

        def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
            if session_id not in self.store:
                self.store[session_id] = InMemoryChatMessageHistory()
            return self.store[session_id]

        self.conversation = RunnableWithMessageHistory(
            self.chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="history",
        )

    def _extract_mission_context(self, user_input: str):
        """Extracts mission details from the user_input string sent by the frontend."""
        match_objective = re.search(r"MISSION OBJECTIVE: (.*?)\n", user_input, re.DOTALL)
        match_architect = re.search(r"Architect: (.*?)\n", user_input, re.DOTALL)
        match_translator = re.search(r"Translator: (.*?)\n", user_input, re.DOTALL)
        
        objective = match_objective.group(1).strip() if match_objective else "General code review."
        role = "Translator"
        role_description = match_translator.group(1).strip() if match_translator else "Focus on syntax."
        
        return objective, role, role_description

    # --- NEW: RAG & LEARNING FEATURES (With Safety Nets) ---

    def log_student_mistake(self, user_code: str, feedback: str, topic: str):
        """Indexes a mistake so the tutor remembers it later."""
        if not self.memory_active or not user_code.strip():
            return
        
        try:
            doc = Document(
                page_content=user_code,
                metadata={"feedback": feedback, "topic": topic, "type": "mistake"}
            )
            self.vector_db.add_documents([doc])
        except Exception as e:
            # Silently fail on quota errors to keep the app running
            print(f"⚠️ Memory Log Skipped (Quota/Network): {e}")

    def generate_custom_mission(self, weakness: str):
        """
        Adaptive Curriculum: Generates a valid JSON mission based on a user's weakness.
        """
        prompt = f"""
        Generate a unique Python coding mission (JSON format) for a student struggling with '{weakness}'.
        
        Format must match this schema exactly, valid JSON only, no markdown:
        {{
            "id": 999,
            "title": "Adaptive: <Creative Title>",
            "difficulty": "Medium",
            "description": "<Cyberpunk themed description>",
            "roles": {{
                "architect": "<Logic hint>",
                "translator": "<Syntax hint>",
                "debugger": "<Debugging hint>"
            }},
            "starter_code": "def solve():\\n    # Write code here\\n    pass",
            "test_cases": [
                {{"input": [<args>], "expected": <val>}}
            ]
        }}
        """
        try:
            response = self.logic_llm.invoke(prompt)
            clean_json = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        except Exception as e:
            print(f"⚠️ Generation Failed: {e}")
            return {"error": "Failed to generate mission due to AI limits."}

    def explain_logic_diff(self, user_code: str, mission_objective: str):
        """
        Code 'Diff' Explanation: Compares user logic to ideal logic conceptually.
        """
        prompt = f"""
        Compare the STUDENT CODE with the MISSION OBJECTIVE.
        Do NOT show the full correct code.
        Generate a "Logical Diff" explaining WHERE their logic diverges from the solution.
        
        Format as:
        - 🔴 Your Logic: <What they did>
        - 🟢 Required Logic: <What they should do>
        - 💡 Hint: <A nudging question>

        MISSION: {mission_objective}
        STUDENT CODE:
        {user_code}
        """
        try:
            response = self.logic_llm.invoke(prompt)
            return response.content
        except Exception as e:
            return "Analysis currently unavailable (Neural Link Overload)."

    # --- MODIFIED CHAT FUNCTION (Crash-Proof) ---

    def chat(self, user_input: str, user_code: str = "", session_id: str = "default_user"):
        # 1. Retrieve Past Context (RAG) - With Safety Net
        rag_context = ""
        if self.memory_active and user_code:
            try:
                results = self.vector_db.similarity_search(user_code, k=1)
                if results:
                    past_feedback = results[0].metadata.get("feedback", "")
                    rag_context = f"Context from Past Performance: You previously struggled with similar logic. Remember this advice: '{past_feedback}'"
            except Exception as e:
                # If Quota exceeded, just ignore memory and proceed with standard chat
                print(f"⚠️ Memory Retrieval Skipped: {e}")
                rag_context = ""

        # 2. Extract Mission Context
        objective, role, role_description = self._extract_mission_context(user_input)
        
        # 3. Build Dynamic System Prompt with RAG
        dynamic_prompt = f"""
        {BASE_SYSTEM_PROMPT}

        CURRENT MISSION CONTEXT:
        MISSION OBJECTIVE: {objective}
        YOUR CURRENT ROLE ({role}): {role_description}
        {rag_context}

        You must respond as the designated {role}. Use the current student's code below as context.
        """
        
        # 4. Clean Input
        clean_input = re.sub(r"MISSION OBJECTIVE:.*?Debugger:.*?$", "", user_input, flags=re.DOTALL).strip()
        full_human_input = f"[STUDENT'S CODE]:\n{user_code}"
        if clean_input and not full_human_input.startswith(clean_input):
            full_human_input = f"{clean_input}\n\n{full_human_input}"

        try:
            # 5. Invoke AI
            response = self.conversation.invoke(
                {"input": full_human_input, "system_prompt": dynamic_prompt},
                config={"configurable": {"session_id": session_id}}
            )
            
            # 6. Auto-Index (Self-Learning System)
            if self.memory_active and ("try" in response.lower() or "remember" in response.lower()):
                self.log_student_mistake(user_code, response, "general")

            return response
            
        except Exception as e:
            return f"⚠️ Neural Link Unstable (AI Rate Limit Reached). Please wait a moment. \nError: {str(e)}"

ai_tutor = SocraticAI()