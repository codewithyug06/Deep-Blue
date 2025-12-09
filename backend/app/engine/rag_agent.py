import os
import re
import json
import logging
import ast
from dotenv import load_dotenv

# --- 1. CONFIGURATION & LOGGING ---
# Suppress noisy "Retrying..." logs from the Google library
logging.getLogger("langchain_google_genai").setLevel(logging.ERROR)
logging.getLogger("google.api_core").setLevel(logging.ERROR)

# Modern LangChain Imports
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_chroma import Chroma
from langchain_core.documents import Document
from google.api_core.exceptions import ResourceExhausted

# Load API Keys
load_dotenv()

# --- 2. PROMPT DEFINITIONS ---
SOCRATIC_SYSTEM_PROMPT = """
You are 'Deep Blue', a Socratic Coding Tutor.
Your goal is to build the student's problem-solving intuition.

STRICT RESPONSE PROTOCOL:
1. 🧐 **Observation**: Acknowledge code state.
2. 💡 **Strategic Hint**: Give a conceptual clue.
3. ❓ **Guiding Question**: Prompt the next step.

Tone: Futuristic, concise (max 4 sentences).
"""

DOUBT_CLEARING_PROMPT = """
You are 'Deep Blue', a Python Expert. Answer directly and concisely.
"""

# --- 3. ROBUST AI CLASS ---
class SocraticAI:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.api_ready = bool(self.api_key)
        
        # CIRCUIT BREAKER: Prevents hanging if quota is hit
        self.quota_exhausted = False 

        # Initialize LLMs (if key exists)
        if self.api_ready:
            # max_retries=0 is CRITICAL to prevent server hanging on 429 errors
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash-preview-09-2025", 
                temperature=0.5,
                max_retries=0, 
                request_timeout=5
            )
            self.logic_llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash-preview-09-2025", 
                temperature=0.1,
                max_retries=0,
                request_timeout=5
            )
        else:
            self.llm = None
            self.logic_llm = None

        # Initialize Vector DB (Memory)
        self.memory_active = False
        self.vector_db = None
        
        if self.api_ready:
            try:
                self.embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=self.api_key
                )
                self.vector_db = Chroma(
                    collection_name="deepblue_knowledge",
                    embedding_function=self.embeddings,
                    persist_directory="./chroma_db"
                )
                self.memory_active = True
            except Exception as e:
                print(f"⚠️ Memory Init Warning: {e}")

        # Memory Store for Chat History
        self.store = {} 

        # Setup LangChain Pipelines
        if self.api_ready:
            # Socratic Chain
            self.socratic_prompt = ChatPromptTemplate.from_messages([
                ("system", "{system_prompt}"), 
                MessagesPlaceholder(variable_name="history"),
                ("human", "{input}"),
            ])
            self.socratic_chain = self.socratic_prompt | self.llm | StrOutputParser()
            
            # Doubt Chain
            self.doubt_prompt = ChatPromptTemplate.from_messages([
                ("system", "{system_prompt}"),
                MessagesPlaceholder(variable_name="history"),
                ("human", "{input}"),
            ])
            self.doubt_chain = self.doubt_prompt | self.llm | StrOutputParser()

            # Wrapped Conversations with History
            self.socratic_conversation = RunnableWithMessageHistory(
                self.socratic_chain, self.get_session_history, input_messages_key="input", history_messages_key="history"
            )
            self.doubt_conversation = RunnableWithMessageHistory(
                self.doubt_chain, self.get_session_history, input_messages_key="input", history_messages_key="history"
            )

    # --- MEMORY MANAGEMENT ---
    def get_session_history(self, session_id: str) -> InMemoryChatMessageHistory:
        if session_id not in self.store:
            self.store[session_id] = InMemoryChatMessageHistory()
        return self.store[session_id]

    def _extract_mission_context(self, user_input: str):
        match = re.search(r"MISSION OBJECTIVE: (.*?)\n", user_input, re.DOTALL)
        return match.group(1).strip() if match else "General code review."

    # --- 4. SMART OFFLINE SIMULATION (Deep Analysis Engine) ---
    def _get_mock_response(self, user_code, user_input=""):
        """
        Deep Static Analysis Engine.
        Analyzes user code structure to answer questions about Logic, Loops, Errors, and Variables.
        """
        user_query = user_input.lower().strip() if user_input else ""
        code_str = user_code.strip()
        lines = code_str.split('\n')

        # --- A. DETECT CODE ISSUES (Static Analysis) ---
        issues = []
        
        # 1. Assignment in Condition (if x = 5)
        if re.search(r"if\s+[a-zA-Z_]\w*\s*=[^=]", code_str):
            issues.append("assignment_in_if")
            
        # 2. Shadowing Built-ins (list = ...)
        if re.search(r"\b(list|dict|str|int|sum|max|min)\s*=", code_str):
            issues.append("shadowing_builtin")
            
        # 3. Missing Print Parentheses (Python 2 style)
        if re.search(r"print\s+[\"']", code_str):
            issues.append("missing_print_parens")
            
        # 4. Infinite Loop Risk (while True without break)
        if "while True" in code_str and "break" not in code_str:
            issues.append("infinite_loop")
            
        # 5. List Append Assignment (x = x.append(y))
        if re.search(r"\w+\s*=\s*\w+\.append\(", code_str):
            issues.append("append_assignment")

        # 6. Missing Return in Function
        has_def = "def " in code_str
        has_return = "return" in code_str
        if has_def and not has_return:
            issues.append("missing_return")

        # --- B. ANSWER USER QUERY (Context-Aware) ---

        # 1. LOGIC & ERRORS ("What is wrong?", "Fix this", "Give logic")
        if any(w in user_query for w in ["wrong", "error", "fix", "bug", "why", "logic", "hint"]):
            if "assignment_in_if" in issues:
                return "🧐 **Observation**: I detected an assignment (`=`) inside an `if` statement.\n💡 **Strategic Hint**: In Python, `=` assigns value, while `==` compares values.\n❓ **Guiding Question**: Did you mean to compare the variable?"
            if "shadowing_builtin" in issues:
                return "⚠️ **Critical Error**: You are assigning a value to a built-in keyword (like `list` or `sum`).\n💡 **Strategic Hint**: This overwrites Python's core functionality, causing crashes later.\n❓ **Guiding Question**: Can you rename that variable to something more specific?"
            if "append_assignment" in issues:
                return "🧐 **Observation**: You are assigning the result of `.append()` to a variable.\n💡 **Strategic Hint**: The `.append()` method modifies the list **in-place** and returns `None`.\n❓ **Guiding Question**: What happens if you remove the `=` assignment?"
            if "missing_print_parens" in issues:
                return "🧐 **Observation**: Your `print` statement looks like Python 2.\n💡 **Strategic Hint**: Python 3 requires parentheses for functions.\n❓ **Guiding Question**: Can you wrap your text in `()`?"
            if "missing_return" in issues:
                return "🧐 **Observation**: Your function runs but returns no data.\n💡 **Strategic Hint**: The system needs a result to verify success.\n❓ **Guiding Question**: What value should be returned at the end?"
            if "pass" in code_str:
                return "🧐 **Observation**: `pass` placeholder detected.\n💡 **Strategic Hint**: Logic is required here to process the input.\n❓ **Guiding Question**: How will you manipulate the input data?"
            
            # If no specific errors found but user asks for logic
            if has_def:
                return "🧐 **Observation**: Your syntax appears valid, but the logic might need refinement.\n💡 **Strategic Hint**: Trace your variable values step-by-step through the logic flow.\n❓ **Guiding Question**: Have you checked your edge cases?"

        # 2. LOOPS ("What loop?", "How to loop?")
        if any(w in user_query for w in ["loop", "iterate", "repeat", "cycle"]):
            if "infinite_loop" in issues:
                return "⚠️ **Risk Alert**: Your `while` loop has no exit condition.\n💡 **Strategic Hint**: This will run forever and freeze the system.\n❓ **Guiding Question**: Where should you place a `break` statement?"
            if "for" in code_str:
                return "🧐 **Observation**: You are using a `for` loop.\n💡 **Concept**: This controls the flow by iterating over a sequence (like a list or range).\n❓ **Guiding Question**: Is your iterator variable capturing the correct value?"
            if "while" in code_str:
                return "🧐 **Observation**: You are using a `while` loop.\n💡 **Concept**: This repeats logic as long as the condition remains `True`.\n❓ **Guiding Question**: Does your logic ensure the condition eventually becomes `False`?"
            return "🧐 **Observation**: No loops detected yet.\n💡 **Concept**: Loops allow you to process data collections or repeat actions.\n❓ **Guiding Question**: Do you need a `for` loop (fixed count) or `while` loop (conditional)?"

        # 3. VARIABLES ("Variable help", "What is x?")
        if any(w in user_query for w in ["variable", "var", "value", "store"]):
            if "assignment_in_if" in issues:
                return "🧐 **Observation**: Variable assignment detected inside a condition.\n💡 **Strategic Hint**: Variables should be assigned before they are compared.\n❓ **Guiding Question**: Check your `if` statement syntax."
            return "📚 **Concept: Variables**: These are containers for data.\n💡 **Tip**: Give them descriptive names (e.g., `player_score` instead of `x`) to make logic clearer.\n❓ **Guiding Question**: Are you initializing all variables before using them?"

        # 4. DEFAULT ANALYZE (Button Click or Generic Query)
        # If no specific query match, fallback to the standard analysis of the code state
        if not code_str:
            return "🧐 **Observation**: The workspace is empty.\n💡 **Strategic Hint**: Start by defining the solution structure.\n❓ **Guiding Question**: ready to write `def solve():`?"
        
        if "pass" in code_str:
            return "🧐 **Observation**: `pass` placeholder detected.\n💡 **Strategic Hint**: Logic is required here to process the input.\n❓ **Guiding Question**: How will you manipulate the input data?"

        if "missing_return" in issues:
            return "🧐 **Observation**: The function runs but returns no data.\n💡 **Strategic Hint**: The system needs a result to verify success.\n❓ **Guiding Question**: What value should be returned at the end?"

        # Fallback for "looks good" state
        return "🧐 **Observation**: Code structure appears valid.\n💡 **Strategic Hint**: Double-check your logic flow against the mission requirements.\n❓ **Guiding Question**: Have you run the **Execute** command to test specific inputs?"

    # --- 5. MAIN CHAT HANDLER (With Circuit Breaker) ---
    def chat(self, user_input: str, user_code: str = "", session_id: str = "default_user", mode: str = "socratic"):
        # STEP 1: Check Circuit Breaker (Fail Fast)
        if not self.api_ready or self.quota_exhausted:
            return self._get_mock_response(user_code, user_input)

        try:
            # STEP 2: RAG Retrieval (Memory)
            rag_context = ""
            if self.memory_active and user_code and mode == "socratic":
                try:
                    results = self.vector_db.similarity_search(user_code, k=1)
                    if results:
                        rag_context = f"\nContext from Past: '{results[0].metadata.get('feedback', '')}'"
                except Exception as e:
                    # If memory fails, just disable it locally and proceed
                    self.memory_active = False 
                    if "429" in str(e):
                        self.quota_exhausted = True # Trip breaker if quota hit here

            # STEP 3: Generate Response
            if self.quota_exhausted:
                 return self._get_mock_response(user_code, user_input)

            if mode == "socratic":
                objective = self._extract_mission_context(user_input)
                dynamic_prompt = f"{SOCRATIC_SYSTEM_PROMPT}\nMISSION: {objective}\n{rag_context}"
                full_input = f"{user_input}\n[STUDENT CODE]:\n{user_code}"
                
                response = self.socratic_conversation.invoke(
                    {"input": full_input, "system_prompt": dynamic_prompt},
                    config={"configurable": {"session_id": session_id}}
                )
            else:
                # Doubt Mode
                response = self.doubt_conversation.invoke(
                    {"input": user_input, "system_prompt": DOUBT_CLEARING_PROMPT},
                    config={"configurable": {"session_id": session_id}}
                )
            
            return response

        except Exception as e:
            error_str = str(e)
            
            # STEP 4: Handle Quota Errors Gracefully
            if "429" in error_str or "ResourceExhausted" in error_str:
                print("⚠️ API QUOTA HIT. Enabling Offline Mode.")
                self.quota_exhausted = True # Trip the circuit breaker for future calls
                return self._get_mock_response(user_code, user_input)
            
            # General Error
            print(f"❌ AI Error: {error_str}")
            return f"⚠️ **System Error**: {error_str[:50]}..."

    # --- 6. SAFEGUARDED UTILITY METHODS ---
    def generate_custom_mission(self, weakness: str):
        return {"error": "AI Offline (Quota Exceeded)"}

    def explain_logic_diff(self, user_code: str, mission_objective: str):
        return "Comparison unavailable in Offline Mode."

    def log_student_mistake(self, user_code: str, feedback: str, topic: str):
        if not self.api_ready or self.quota_exhausted or not self.memory_active: 
            return
        try:
            doc = Document(page_content=user_code, metadata={"feedback": feedback, "topic": topic, "type": "mistake"})
            self.vector_db.add_documents([doc])
        except Exception:
            pass 

# Initialize the global instance
ai_tutor = SocraticAI()