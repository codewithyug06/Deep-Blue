import ast
import json

class CodeTo3DVisitor(ast.NodeVisitor):
    def __init__(self):
        self.nodes = []
        self.links = []
        self.parent_stack = [] 
        self.node_counter = 0

    def _add_node(self, label, type_name, lineno=None):
        # Assign a unique integer ID for easier linking
        node_id = self.node_counter 
        node_data = {
            "id": node_id,
            "label": label,
            "type": type_name,
            "group": 1 if type_name == "function" else 2 # Grouping helps with visual clustering
        }
        # Add line number metadata if available (Critical for Execution Flow Visualization)
        if lineno is not None:
            node_data["lineno"] = lineno
            
        self.nodes.append(node_data)
        self.node_counter += 1
        return node_id

    def _add_link(self, source_id, target_id):
        # Ensure the link uses integer IDs
        self.links.append({
            "source": int(source_id),
            "target": int(target_id)
        })

    def generic_visit(self, node):
        super().generic_visit(node)

    # --- Core Structure Nodes ---

    def visit_FunctionDef(self, node):
        # Pass node.lineno to _add_node
        node_id = self._add_node(f"Func: {node.name}", "function", getattr(node, 'lineno', None))
        if self.parent_stack:
            self._add_link(self.parent_stack[-1], node_id)
        self.parent_stack.append(node_id)
        self.generic_visit(node)
        self.parent_stack.pop()
        
    # --- Control Flow Nodes ---

    def visit_For(self, node):
        target = node.target.id if isinstance(node.target, ast.Name) else "iterator"
        node_id = self._add_node(f"Loop: For {target}", "loop", getattr(node, 'lineno', None))
        if self.parent_stack:
            self._add_link(self.parent_stack[-1], node_id)
        self.parent_stack.append(node_id)
        self.generic_visit(node)
        self.parent_stack.pop()

    def visit_If(self, node):
        # We can try to extract the first part of the condition for a better label
        test_label = ast.dump(node.test, indent=None).split('\n')[0]
        node_id = self._add_node(f"Decision: If ({test_label[:20]}...)", "decision", getattr(node, 'lineno', None))
        if self.parent_stack:
            self._add_link(self.parent_stack[-1], node_id)
        self.parent_stack.append(node_id)
        self.generic_visit(node)
        self.parent_stack.pop()

    # --- Data/Operation Nodes (NEW) ---

    def visit_Assign(self, node):
        # Handles variable assignments: e.g., 'x = 10'
        # Get the target variable name (handles simple assignment)
        target_name = node.targets[0].id if hasattr(node.targets[0], 'id') else 'Assignment'
        node_id = self._add_node(f"Assign: {target_name}", "statement", getattr(node, 'lineno', None))
        if self.parent_stack:
            self._add_link(self.parent_stack[-1], node_id)
        
        # We don't push 'Assign' to parent_stack because subsequent nodes usually aren't nested within the assignment itself
        self.generic_visit(node)

    def visit_Call(self, node):
        # Handles function calls: e.g., 'print()', 'list.pop()'
        func_name = ""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            # Handles method calls: list.pop, str.lower
            if hasattr(node.func.value, 'id'):
                object_name = node.func.value.id
            else:
                object_name = 'Object'
            func_name = f"{object_name}.{node.func.attr}"
            
        node_id = self._add_node(f"Call: {func_name}", "operation", getattr(node, 'lineno', None))
        if self.parent_stack:
            self._add_link(self.parent_stack[-1], node_id)
        
        self.generic_visit(node)

def parse_code_to_3d(code_string):
    """
    Parses Python code into an AST and converts it into a network graph structure.
    """
    try:
        # Prevent parsing empty code to avoid unnecessary errors
        if not code_string.strip():
             return {"error": "Code input is empty.", "nodes": [], "links": []}
             
        tree = ast.parse(code_string)
        visitor = CodeTo3DVisitor()
        visitor.visit(tree)
        
        # Use integer IDs as numbers for strict JSON formatting
        final_nodes = [{k: int(v) if k == 'id' else v for k, v in node.items()} for node in visitor.nodes]
        final_links = [{k: int(v) if isinstance(v, str) and v.isdigit() else v for k, v in link.items()} for link in visitor.links]
        
        return {"nodes": final_nodes, "links": final_links}
    except SyntaxError as e:
        return {"error": f"Syntax Error: {e.msg} at line {e.lineno}", "nodes": [], "links": []}
    except Exception as e:
        return {"error": str(e), "nodes": [], "links": []}