# Codebase Indexing & Memory Ingestion Workflow

## Objective
Your task is to systematically scan the codebase, file by file, and save the structural knowledge (functions, variables, classes, and architectural purpose) into the Memory MCP (MegaMemory). You must NOT attempt to read all files at once.

## Pre-requisites
- Ensure the Memory MCP is active.
- Ignore directories: `node_modules`, `.git`, `dist`, `build`, `vendor`.

## Step-by-Step Execution

### Phase 1: File Discovery
1. Run a command to list all relevant code files in the current directory (e.g., using `find` or `ls`).
2. Create a checklist of files to process. DO NOT read them yet.

### Phase 2: Sequential Processing (Loop per File)
For **EACH** file in the checklist, perform the following steps exactly one by one:

1. **Read**: Read the contents of the single file.
2. **Analyze**: Extract the following information:
   - File purpose (1 sentence).
   - Exported functions/methods (name, parameters, return types).
   - Classes and their properties.
   - Global/Important variables.
   - Dependencies (imports).
3. **Store**: Call the Memory MCP tool (e.g., `create_concept` or `memory_store`) to save the extracted data. Use the file path as the Concept Name or Tag.
4. **Proceed**: Move to the next file ONLY after the memory is successfully saved.

## Example Memory Storage Format
When calling the Memory MCP, format the payload conceptually like this:
- **Concept**: `src/utils/parser.ts`
- **Details**: "Exports `parseInput(string)` which returns a parsed AST node. Depends on `lodash` and `ast-types`. Contains 3 helper functions: `tokenize`, `validate`, `buildTree`."

## Rules
- NEVER read multiple files in one go.
- If a file is too large (>500 lines), summarize its exports and core logic instead of reading every single line.
- If the Memory MCP fails, log the error and continue to the next file.
- Do not ask for permission between files; run the loop autonomously until all files are indexed.
