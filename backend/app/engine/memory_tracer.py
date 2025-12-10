# backend/memory_tracer.py
import sys
import json
import inspect
import types

class MemoryTracer:
    def __init__(self):
        self.trace_data = []
        self.heap_snapshot = {}

    def serialize_obj(self, obj):
        """
        Converts a Python object into a JSON-serializable description 
        and maps its children (references).
        """
        obj_id = str(id(obj))
        obj_type = type(obj).__name__
        repr_str = str(obj)
        
        # Default Heap Object structure
        data = {
            "id": obj_id,
            "type": obj_type,
            "value": repr_str[:50], # Truncate long values
            "children": [] # List of IDs this object points to
        }

        # Handle Container Types (Lists, Dicts, Tuples) to find references
        if isinstance(obj, (list, tuple, set)):
            data["value"] = f"{obj_type}({len(obj)})"
            for item in obj:
                child_id = str(id(item))
                data["children"].append(child_id)
                self.heap_snapshot[child_id] = self.serialize_obj(item)
                
        elif isinstance(obj, dict):
            data["value"] = f"dict({len(obj)})"
            for key, val in obj.items():
                # We track values as children, keys are usually primitives (visual simplifiction)
                child_id = str(id(val))
                data["children"].append(child_id)
                self.heap_snapshot[child_id] = self.serialize_obj(val)
        
        # Primitives are just stored, no children
        return data

    def trace_calls(self, frame, event, arg):
        if event != 'line':
            return self.trace_calls
            
        # 1. Capture The Stack (Local Variables)
        stack_frame = {}
        # Filter out internal python variables
        locals_dict = {k: v for k, v in frame.f_locals.items() if not k.startswith('__')}
        
        self.heap_snapshot = {} # Reset heap snapshot for this frame to capture current state
        
        for var_name, var_value in locals_dict.items():
            obj_id = str(id(var_value))
            stack_frame[var_name] = obj_id
            
            # 2. Capture The Heap (Recursively map objects)
            if obj_id not in self.heap_snapshot:
                self.heap_snapshot[obj_id] = self.serialize_obj(var_value)

        # 3. Record the Frame
        self.trace_data.append({
            "line": frame.f_lineno,
            "event": event,
            "stack": stack_frame,
            "heap": self.heap_snapshot
        })
        
        return self.trace_calls

    def run(self, code):
        self.trace_data = []
        try:
            # Create a dedicated scope
            scope = {}
            sys.settrace(self.trace_calls)
            exec(code, scope)
        except Exception as e:
            self.trace_data.append({
                "error": str(e),
                "line": -1
            })
        finally:
            sys.settrace(None)
        
        return json.dumps(self.trace_data)

# --- Example Usage for Testing ---
if __name__ == "__main__":
    code_to_run = """
a = [1, 2, 3]
b = a          # Reference Copy
c = a.copy()   # Shallow Copy
x = 10
    """
    tracer = MemoryTracer()
    result = tracer.run(code_to_run)
    print(result) # Send this JSON to Frontend