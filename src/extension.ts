import * as vscode from 'vscode';

// Define the TODO states sequence
const TODO_STATES = ['TODO', 'IN-PROGRESS', 'WAITING', 'DONE', ''];
const TODO_REGEX = /^(\s*)(\*+\s+)(?:(TODO|IN-PROGRESS|WAITING|DONE)\s+)?(.*)$/;
const CHECKBOX_REGEX = /^(\s*)(-\s+\[[ xX]\])(.*)$/;

export function activate(context: vscode.ExtensionContext) {
    console.log('Org Mode extension is now active');
    
    // We'll create decoration types dynamically in the updateDecorations function
    
    // Register the toggleTodo command
    let toggleTodoCommand = vscode.commands.registerCommand('org-mode.toggleTodo', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        const todoMatch = lineText.match(TODO_REGEX);
        if (todoMatch) {
            const [, indent, stars, currentState, rest] = todoMatch;
            
            // Find the next state
            let nextStateIndex = 0;
            if (currentState) {
                nextStateIndex = (TODO_STATES.indexOf(currentState) + 1) % TODO_STATES.length;
            } else {
                nextStateIndex = 0; // Start with the first state if no state exists
            }
            
            const nextState = TODO_STATES[nextStateIndex];
            const newText = nextState 
                ? `${indent}${stars}${nextState} ${rest}` 
                : `${indent}${stars}${rest}`;
            
            editor.edit(editBuilder => {
                editBuilder.replace(line.range, newText);
            });
        }
    });
    
    // Register the toggleCheckbox command
    let toggleCheckboxCommand = vscode.commands.registerCommand('org-mode.toggleCheckbox', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        // Check if the line has a checkbox
        if (lineText.match(/\[[ xX]\]/)) {
            let newText = lineText;
            if (lineText.includes('[ ]')) {
                newText = lineText.replace('[ ]', '[x]');
            } else if (lineText.includes('[x]') || lineText.includes('[X]')) {
                newText = lineText.replace(/\[[xX]\]/, '[ ]');
            }
            
            editor.edit(editBuilder => {
                editBuilder.replace(line.range, newText);
            });
        } else if (lineText.match(/^\s*-\s+/)) {
            // If it's a list item without a checkbox, add one
            const newText = lineText.replace(/^(\s*-\s+)/, '$1[ ] ');
            editor.edit(editBuilder => {
                editBuilder.replace(line.range, newText);
            });
        }
    });
    
    // Register the newItem command
    let newItemCommand = vscode.commands.registerCommand('org-mode.newItem', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        const todoMatch = lineText.match(TODO_REGEX);
        const checkboxMatch = lineText.match(/^\s*-\s+\[[ xX]\]/);
        
        let newLineText = '';
        let insertLineNumber = position.line + 1;  // Default to next line
        
        if (todoMatch) {
            // If this is a TODO heading, we need to find the end of this block
            const [, indent, stars, currentState] = todoMatch;
            const currentHeadingLevel = stars.trim().length;
            newLineText = currentState 
                ? `${indent}${stars}${currentState} ` 
                : `${indent}${stars}`;
            
            // Find the end of the current block
            for (let i = position.line + 1; i < document.lineCount; i++) {
                const nextLineText = document.lineAt(i).text;
                const nextHeadingMatch = nextLineText.match(/^(\s*)(\*+)\s+/);
                
                if (nextHeadingMatch) {
                    const nextHeadingLevel = nextHeadingMatch[2].trim().length;
                    
                    // If we find a heading of the same or higher level, insert before it
                    if (nextHeadingLevel <= currentHeadingLevel) {
                        insertLineNumber = i;
                        break;
                    }
                }
                
                // If we reach the end of the document, insert at the end
                if (i === document.lineCount - 1) {
                    insertLineNumber = document.lineCount;
                    break;
                }
            }
        } else if (checkboxMatch) {
            const indent = lineText.match(/^(\s*)/)?.[1] || '';
            newLineText = `${indent}- [ ] `;
        } else {
            // Default new line
            const indent = lineText.match(/^(\s*)/)?.[1] || '';
            newLineText = `${indent}`;
        }
        
        // Add an extra blank line if inserting after a block and not at end of file
        const needsBlankLine = (insertLineNumber < document.lineCount && 
                                insertLineNumber > position.line + 1);
        
        editor.edit(editBuilder => {
            if (needsBlankLine) {
                editBuilder.insert(new vscode.Position(insertLineNumber, 0), '\n' + newLineText + '\n');
            } else {
                editBuilder.insert(new vscode.Position(insertLineNumber, 0), newLineText + '\n');
            }
        }).then(() => {
            // Move cursor to the end of the newly inserted line
            const newPosition = new vscode.Position(
                needsBlankLine ? insertLineNumber + 1 : insertLineNumber,
                newLineText.length
            );
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });
    
    // Register the Todo state picker command
    let chooseTodoStateCommand = vscode.commands.registerCommand('org-mode.chooseTodoState', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        const todoMatch = lineText.match(TODO_REGEX);
        if (todoMatch) {
            const [, indent, stars, currentState, rest] = todoMatch;
            
            // Create quick pick items for TODO states
            const quickPickItems = TODO_STATES.map(state => ({
                label: state || '(none)',
                description: state ? `Change to ${state}` : 'Remove TODO state',
                state: state
            }));
            
            // Show quick pick
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select TODO state',
                title: 'Choose TODO State'
            });
            
            if (selectedItem) {
                const newState = selectedItem.state;
                const newText = newState 
                    ? `${indent}${stars}${newState} ${rest}` 
                    : `${indent}${stars}${rest}`;
                
                editor.edit(editBuilder => {
                    editBuilder.replace(line.range, newText);
                });
            }
        }
    });
    
    // Register the Create Checkbox command
    let createCheckboxCommand = vscode.commands.registerCommand('org-mode.createCheckbox', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineIndent = line.text.match(/^(\s*)/)?.[1] || '';
        
        // Create a new checkbox item
        const newCheckboxItem = `${lineIndent}- [ ] `;
        
        editor.edit(editBuilder => {
            // Insert at current line if it's empty, otherwise insert at next line
            if (line.isEmptyOrWhitespace) {
                editBuilder.replace(line.range, newCheckboxItem);
            } else {
                editBuilder.insert(new vscode.Position(position.line + 1, 0), newCheckboxItem + '\n');
            }
        }).then(() => {
            // Move cursor to end of the checkbox
            const newLine = line.isEmptyOrWhitespace ? position.line : position.line + 1;
            const newPosition = new vscode.Position(newLine, newCheckboxItem.length);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });
    
    // Register the Create Example Block command
    let createExampleBlockCommand = vscode.commands.registerCommand('org-mode.createExampleBlock', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineIndent = line.text.match(/^(\s*)/)?.[1] || '';
        
        // Ask if the user wants to include a checkbox
        const options = [
            'No checkbox', 
            'With unchecked checkbox [ ] (separated)', 
            'With checked checkbox [x] (separated)',
            'With unchecked checkbox[ ] (attached)',
            'With checked checkbox[x] (attached)'
        ];
        
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Create example block with or without checkbox?'
        });
        
        let prefix = '';
        if (selection === options[1]) {
            prefix = '- [ ] ';
        } else if (selection === options[2]) {
            prefix = '- [x] ';
        } else if (selection === options[3]) {
            prefix = '[ ]';
        } else if (selection === options[4]) {
            prefix = '[x]';
        }
        
        // Create example block with three lines
        const beginLine = `${lineIndent}${prefix}#+BEGIN_EXAMPLE`;
        const middleLine = `${lineIndent}  `;
        const endLine = `${lineIndent}${prefix}#+END_EXAMPLE`;
        const exampleBlock = `${beginLine}\n${middleLine}\n${endLine}`;
        
        editor.edit(editBuilder => {
            // Insert at current line if it's empty, otherwise insert at next line
            if (line.isEmptyOrWhitespace) {
                editBuilder.replace(line.range, exampleBlock);
            } else {
                editBuilder.insert(new vscode.Position(position.line + 1, 0), exampleBlock + '\n');
            }
        }).then(() => {
            // Move cursor to the middle line
            const middleLineNumber = line.isEmptyOrWhitespace ? position.line + 1 : position.line + 2;
            const newPosition = new vscode.Position(middleLineNumber, middleLine.length);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });
    
    // Register the Fold All command
    let foldAllCommand = vscode.commands.registerCommand('org-mode.foldAll', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'org') return;
        
        // Fold all regions in the document
        await vscode.commands.executeCommand('editor.foldAll');
    });
    
    // Register the Unfold All command
    let unfoldAllCommand = vscode.commands.registerCommand('org-mode.unfoldAll', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'org') return;
        
        // Unfold all regions in the document
        await vscode.commands.executeCommand('editor.unfoldAll');
    });
    
    function updateDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'org') {
            return;
        }
        
        // Get user settings
        const config = vscode.workspace.getConfiguration('orgMode');
        const highlightEntireLine = config.get('highlightEntireLine', true);
        const boldEntireLine = config.get('boldEntireLine', false);
        const highlightCodeBlocks = config.get('highlightCodeBlocks', true);
        const codeBlockOpacity = config.get('codeBlockOpacity', 0.1);
        
        // Calculate the background color with the configured opacity
        const codeBlockBgColor = `rgba(75, 0, 130, ${codeBlockOpacity})`;
        
        // Create decoration types based on current settings
        const createDecorationType = (color: string, bgColor: string) => {
            return vscode.window.createTextEditorDecorationType({
                backgroundColor: bgColor,
                // Only color the keyword itself, not the entire line text
                color: highlightEntireLine ? color : undefined,
                fontWeight: boldEntireLine ? 'bold' : undefined,
                isWholeLine: false,  // We'll handle block highlighting separately
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
        };
        
        // Create decoration types based on current settings
        const currentTodoDecorationType = createDecorationType('#FF8C00', 'rgba(255, 140, 0, 0.1)');
        const currentInProgressDecorationType = createDecorationType('#FFD700', 'rgba(255, 215, 0, 0.1)');
        const currentWaitingDecorationType = createDecorationType('#4682B4', 'rgba(70, 130, 180, 0.1)');
        const currentDoneDecorationType = createDecorationType('#32CD32', 'rgba(50, 205, 50, 0.1)');
        
        // Create background decoration types for entire TODO blocks
        const todoBlockBgDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 140, 0, 0.1)',  // Light orange background
            isWholeLine: true
        });
        
        const inProgressBlockBgDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 215, 0, 0.1)',  // Light gold/yellow background
            isWholeLine: true
        });
        
        const waitingBlockBgDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(70, 130, 180, 0.1)',  // Light steel blue background
            isWholeLine: true
        });
        
        const doneBlockBgDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(50, 205, 50, 0.1)',  // Light green background
            isWholeLine: true
        });
        
        // Arrays to hold the block background decorations
        const todoBlockBgLines: vscode.Range[] = [];
        const inProgressBlockBgLines: vscode.Range[] = [];
        const waitingBlockBgLines: vscode.Range[] = [];
        const doneBlockBgLines: vscode.Range[] = [];
        
        // Create decoration type for source code and example blocks
        const srcBlockDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: codeBlockBgColor,
            isWholeLine: true
        });
        
        const exampleBlockDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: codeBlockBgColor,
            isWholeLine: true
        });
        
        // Create decoration type for checked blocks (green text)
        const checkedSrcBlockDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: codeBlockBgColor,
            color: '#32CD32', // Green text
            isWholeLine: true
        });
        
        const checkedExampleBlockDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: codeBlockBgColor,
            color: '#32CD32', // Green text
            isWholeLine: true
        });
        
        // Create decoration types for priority tags
        const priorityADecorationType = vscode.window.createTextEditorDecorationType({
            color: '#FF0000', // Red
            fontWeight: 'bold',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        const priorityBDecorationType = vscode.window.createTextEditorDecorationType({
            color: '#FFA500', // Orange
            fontWeight: 'bold',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        const priorityCDecorationType = vscode.window.createTextEditorDecorationType({
            color: '#FFD700', // Gold/Yellow
            fontWeight: 'bold',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        const priorityDDecorationType = vscode.window.createTextEditorDecorationType({
            color: '#00FFFF', // Cyan
            fontWeight: 'bold',
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        const text = editor.document.getText();
        const todoLines: vscode.Range[] = [];
        const inProgressLines: vscode.Range[] = [];
        const waitingLines: vscode.Range[] = [];
        const doneLines: vscode.Range[] = [];
        const srcBlockLines: vscode.Range[] = [];
        const exampleBlockLines: vscode.Range[] = [];
        const checkedSrcBlockLines: vscode.Range[] = [];
        const checkedExampleBlockLines: vscode.Range[] = [];
        
        // Priority tag decoration ranges
        const priorityADecorations: vscode.Range[] = [];
        const priorityBDecorations: vscode.Range[] = [];
        const priorityCDecorations: vscode.Range[] = [];
        const priorityDDecorations: vscode.Range[] = [];
        
        // Process TODO lines, blocks, and priority tags
        let currentBlockType: string | null = null;
        let currentBlockLevel: number = 0;
        let currentBlockStart: number = 0;
        
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Find priority tags in any line
            const priorityMatches = [...line.matchAll(/\[(#[A-D])\]/g)];
            for (const match of priorityMatches) {
                const start = match.index || 0;
                const end = start + match[0].length;
                const range = new vscode.Range(i, start, i, end);
                
                if (match[1] === '#A') {
                    priorityADecorations.push(range);
                } else if (match[1] === '#B') {
                    priorityBDecorations.push(range);
                } else if (match[1] === '#C') {
                    priorityCDecorations.push(range);
                } else if (match[1] === '#D') {
                    priorityDDecorations.push(range);
                }
            }
            
            // Check for headings which may start or end blocks
            const headingMatch = line.match(/^(\s*)(\*+)\s+(?:(TODO|IN-PROGRESS|WAITING|DONE)\s+)?(.*)$/);
            
            if (headingMatch) {
                const level = headingMatch[2].length;
                const state = headingMatch[3] || "";
                
                // If we're in a block and this heading is same or higher level, end the current block
                if (currentBlockType && level <= currentBlockLevel) {
                    // Add a range for the entire block we just finished
                    const blockRange = new vscode.Range(currentBlockStart, 0, i - 1, lines[i - 1].length);
                    
                    if (currentBlockType === 'TODO') {
                        todoBlockBgLines.push(blockRange);
                    } else if (currentBlockType === 'IN-PROGRESS') {
                        inProgressBlockBgLines.push(blockRange);
                    } else if (currentBlockType === 'WAITING') {
                        waitingBlockBgLines.push(blockRange);
                    } else if (currentBlockType === 'DONE') {
                        doneBlockBgLines.push(blockRange);
                    }
                    
                    currentBlockType = null;
                }
                
                // Check if this heading starts a new block
                if (state) {
                    currentBlockType = state;
                    currentBlockLevel = level;
                    currentBlockStart = i;
                }
                
                // Highlight the specific TODO keyword
                if (state === 'TODO') {
                    const keywordStart = line.indexOf('TODO');
                    todoLines.push(new vscode.Range(i, keywordStart, i, keywordStart + 4));
                } else if (state === 'IN-PROGRESS') {
                    const keywordStart = line.indexOf('IN-PROGRESS');
                    inProgressLines.push(new vscode.Range(i, keywordStart, i, keywordStart + 11));
                } else if (state === 'WAITING') {
                    const keywordStart = line.indexOf('WAITING');
                    waitingLines.push(new vscode.Range(i, keywordStart, i, keywordStart + 7));
                } else if (state === 'DONE') {
                    const keywordStart = line.indexOf('DONE');
                    doneLines.push(new vscode.Range(i, keywordStart, i, keywordStart + 4));
                }
            }
            
            // Process source code and example blocks
            let inSrcBlock = false;
            let inExampleBlock = false;
            let blockStartLine = 0;
            let isCheckedBlock = false;
            
            // Check for beginning of source block, including with a checkbox
            const srcBeginMatch = line.match(/^\s*(?:(?:-\s+)?\[([xX\s])\])?\s*#\+BEGIN_SRC\b/);
            if (srcBeginMatch) {
                inSrcBlock = true;
                blockStartLine = i;
                isCheckedBlock = typeof srcBeginMatch[1] === 'string' && (srcBeginMatch[1].toLowerCase() === 'x');
            }
            // Check for end of source block, including with a checkbox
            else if (line.match(/^\s*(?:(?:-\s+)?\[[xX\s]\])?\s*#\+END_SRC\b/) && inSrcBlock) {
                inSrcBlock = false;
                const blockRange = new vscode.Range(blockStartLine, 0, i, line.length);
                if (isCheckedBlock) {
                    checkedSrcBlockLines.push(blockRange);
                } else {
                    srcBlockLines.push(blockRange);
                }
            }
            // Check for beginning of example block, including with a checkbox
            const exampleBeginMatch = line.match(/^\s*(?:(?:-\s+)?\[([xX\s])\])?\s*#\+BEGIN_EXAMPLE\b/);
            if (exampleBeginMatch) {
                inExampleBlock = true;
                blockStartLine = i;
                isCheckedBlock = typeof exampleBeginMatch[1] === 'string' && (exampleBeginMatch[1].toLowerCase() === 'x');
            }
            // Check for end of example block, including with a checkbox
            else if (line.match(/^\s*(?:(?:-\s+)?\[[xX\s]\])?\s*#\+END_EXAMPLE\b/) && inExampleBlock) {
                inExampleBlock = false;
                const blockRange = new vscode.Range(blockStartLine, 0, i, line.length);
                if (isCheckedBlock) {
                    checkedExampleBlockLines.push(blockRange);
                } else {
                    exampleBlockLines.push(blockRange);
                }
            }
        }
        
        // If we reached the end of the file and we're still in a block, close it
        if (currentBlockType) {
            const blockRange = new vscode.Range(currentBlockStart, 0, lines.length - 1, lines[lines.length - 1].length);
            
            if (currentBlockType === 'TODO') {
                todoBlockBgLines.push(blockRange);
            } else if (currentBlockType === 'IN-PROGRESS') {
                inProgressBlockBgLines.push(blockRange);
            } else if (currentBlockType === 'WAITING') {
                waitingBlockBgLines.push(blockRange);
            } else if (currentBlockType === 'DONE') {
                doneBlockBgLines.push(blockRange);
            }
        }
        
        // Make sure to apply decorations in the right order:
        // First apply block backgrounds, then keywords, then priority tags
        
        // First apply the block background decorations
        editor.setDecorations(todoBlockBgDecorationType, todoBlockBgLines);
        editor.setDecorations(inProgressBlockBgDecorationType, inProgressBlockBgLines);
        editor.setDecorations(waitingBlockBgDecorationType, waitingBlockBgLines);
        editor.setDecorations(doneBlockBgDecorationType, doneBlockBgLines);
        
        // Then apply keyword decorations
        editor.setDecorations(currentTodoDecorationType, todoLines);
        editor.setDecorations(currentInProgressDecorationType, inProgressLines);
        editor.setDecorations(currentWaitingDecorationType, waitingLines);
        editor.setDecorations(currentDoneDecorationType, doneLines);
        
        // Then apply code block decorations
        if (highlightCodeBlocks) {
            editor.setDecorations(srcBlockDecorationType, srcBlockLines);
            editor.setDecorations(exampleBlockDecorationType, exampleBlockLines);
            editor.setDecorations(checkedSrcBlockDecorationType, checkedSrcBlockLines);
            editor.setDecorations(checkedExampleBlockDecorationType, checkedExampleBlockLines);
        } else {
            editor.setDecorations(srcBlockDecorationType, []);
            editor.setDecorations(exampleBlockDecorationType, []);
            editor.setDecorations(checkedSrcBlockDecorationType, []);
            editor.setDecorations(checkedExampleBlockDecorationType, []);
        }
        
        // Finally apply priority tag decorations
        editor.setDecorations(priorityADecorationType, priorityADecorations);
        editor.setDecorations(priorityBDecorationType, priorityBDecorations);
        editor.setDecorations(priorityCDecorationType, priorityCDecorations);
        editor.setDecorations(priorityDDecorationType, priorityDDecorations);
        
        // Clean up decoration types when no longer needed
        return () => {
            currentTodoDecorationType.dispose();
            currentInProgressDecorationType.dispose();
            currentWaitingDecorationType.dispose();
            currentDoneDecorationType.dispose();
            todoBlockBgDecorationType.dispose();
            inProgressBlockBgDecorationType.dispose();
            waitingBlockBgDecorationType.dispose();
            doneBlockBgDecorationType.dispose();
            srcBlockDecorationType.dispose();
            exampleBlockDecorationType.dispose();
            checkedSrcBlockDecorationType.dispose();
            checkedExampleBlockDecorationType.dispose();
            priorityADecorationType.dispose();
            priorityBDecorationType.dispose();
            priorityCDecorationType.dispose();
            priorityDDecorationType.dispose();
        };
    }
    
    // Track the cleanup function
    let decorationCleanup: (() => void) | undefined;
    
    // Function to safely update decorations with cleanup
    function safeUpdateDecorations() {
        // Clean up previous decorations if any
        if (decorationCleanup) {
            decorationCleanup();
        }
        
        // Apply new decorations and store cleanup function
        decorationCleanup = updateDecorations();
    }
    
    // Function to update context keys for keybinding conditions
    function updateContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'org') {
            vscode.commands.executeCommand('setContext', 'org-mode.isTodoHeading', false);
            vscode.commands.executeCommand('setContext', 'org-mode.isHeadingLine', false);
            vscode.commands.executeCommand('setContext', 'org-mode.isTableRow', false);
            return;
        }
        
        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const lineText = line.text;
        
        // Check if cursor is on a TODO heading line
        const isTodoHeading = !!lineText.match(TODO_REGEX);
        vscode.commands.executeCommand('setContext', 'org-mode.isTodoHeading', isTodoHeading);
        // Check if cursor is on any heading line (with or without TODO state)
        const isHeadingLine = !!lineText.match(/^\s*\*+\s+/);
        vscode.commands.executeCommand('setContext', 'org-mode.isHeadingLine', isHeadingLine);
        // Check if cursor is on a table row
        const isTableRow = lineText.trim().startsWith('|');
        vscode.commands.executeCommand('setContext', 'org-mode.isTableRow', isTableRow);
    }
    
    // Update decorations initially
    safeUpdateDecorations();
    updateContext();
    
    // Update decorations and context when the document or selections change
    vscode.window.onDidChangeActiveTextEditor(() => {
        safeUpdateDecorations();
        updateContext();
    }, null, context.subscriptions);
    
    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            safeUpdateDecorations();
        }
    }, null, context.subscriptions);
    
    vscode.window.onDidChangeTextEditorSelection(() => {
        updateContext();
    }, null, context.subscriptions);
    
    // Update decorations when settings change
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('orgMode')) {
            safeUpdateDecorations();
        }
    }, null, context.subscriptions);
    
    context.subscriptions.push(
        toggleTodoCommand, 
        toggleCheckboxCommand, 
        newItemCommand,
        chooseTodoStateCommand,
        createCheckboxCommand,
        createExampleBlockCommand,
        foldAllCommand,
        unfoldAllCommand
    );

    // Register the Toggle Fold command
    let toggleFoldCommand = vscode.commands.registerCommand('org-mode.toggleFold', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'org') return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const lineText = line.text;
        
        // Check if this is a heading line
        const headingMatch = lineText.match(/^(\s*)(\*+)\s+/);
        if (!headingMatch) return;
        
        const headingLevel = headingMatch[2].length;
        const lineNumber = position.line;
        
        // Find the end line of this heading's section
        let endLine = document.lineCount - 1; // Default to end of document
        
        for (let i = lineNumber + 1; i < document.lineCount; i++) {
            const nextLineText = document.lineAt(i).text;
            const nextHeadingMatch = nextLineText.match(/^(\s*)(\*+)\s+/);
            
            if (nextHeadingMatch && nextHeadingMatch[2].length <= headingLevel) {
                // Found a heading of same or higher level, which means end of current section
                endLine = i - 1;
                break;
            }
        }
        
        // Create a fold/unfold region
        const startPos = new vscode.Position(lineNumber, 0);
        const endPos = new vscode.Position(endLine, document.lineAt(endLine).text.length);
        const range = new vscode.Range(startPos, endPos);
        
        // Determine if the region is currently folded
        let isFolded = false;
        for (const folded of editor.visibleRanges) {
            // If we can't see the line after the heading, it's likely folded
            if (lineNumber + 1 <= endLine && 
                lineNumber + 1 > folded.start.line && 
                lineNumber + 1 < folded.end.line) {
                isFolded = false;
                break;
            }
            isFolded = true;
        }
        
        // Toggle folding
        if (isFolded) {
            // Unfold
            vscode.commands.executeCommand('editor.unfold', {selectionLines: [lineNumber]});
        } else {
            // Fold
            editor.revealRange(range, vscode.TextEditorRevealType.Default);
            vscode.commands.executeCommand('editor.fold', {selectionLines: [lineNumber]});
        }
    });

    // Add this to context.subscriptions
    context.subscriptions.push(toggleFoldCommand);

    // Register the table navigation commands
    let moveToNextCellCommand = vscode.commands.registerCommand('org-mode.moveToNextCell', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const lineText = document.lineAt(position.line).text;
        
        // Check if we're in a table line
        if (!lineText.trim().startsWith('|')) return;
        
        // Find the next pipe character after the current position
        const nextPipeIndex = lineText.indexOf('|', position.character + 1);
        
        if (nextPipeIndex !== -1) {
            // Move to after the next pipe
            const newPosition = new vscode.Position(position.line, nextPipeIndex + 1);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        } else {
            // Move to the beginning of the next line if it's a table line
            if (position.line + 1 < document.lineCount) {
                const nextLineText = document.lineAt(position.line + 1).text;
                if (nextLineText.trim().startsWith('|')) {
                    // Find the first cell position
                    const firstPipeIndex = nextLineText.indexOf('|');
                    const newPosition = new vscode.Position(position.line + 1, firstPipeIndex + 1);
                    editor.selection = new vscode.Selection(newPosition, newPosition);
                }
            }
        }
    });

    let moveToPreviousCellCommand = vscode.commands.registerCommand('org-mode.moveToPreviousCell', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const lineText = document.lineAt(position.line).text;
        
        // Check if we're in a table line
        if (!lineText.trim().startsWith('|')) return;
        
        // Find the previous two pipe characters before the current position
        let prevPipeIndex1 = lineText.lastIndexOf('|', position.character - 1);
        
        if (prevPipeIndex1 !== -1) {
            let prevPipeIndex2 = lineText.lastIndexOf('|', prevPipeIndex1 - 1);
            
            if (prevPipeIndex2 !== -1) {
                // Move to after the previous pipe
                const newPosition = new vscode.Position(position.line, prevPipeIndex2 + 1);
                editor.selection = new vscode.Selection(newPosition, newPosition);
            } else if (position.line > 0) {
                // Move to the last cell of the previous line if it's a table line
                const prevLineText = document.lineAt(position.line - 1).text;
                if (prevLineText.trim().startsWith('|')) {
                    // Find the last pipe index
                    const pipes = Array.from(prevLineText.matchAll(/\|/g));
                    if (pipes.length > 1) {
                        const secondLastPipeIndex = pipes[pipes.length - 2].index || 0;
                        const newPosition = new vscode.Position(position.line - 1, secondLastPipeIndex + 1);
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                    }
                }
            }
        }
    });

    let formatTableCommand = vscode.commands.registerCommand('org-mode.formatTable', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        const lineText = document.lineAt(position.line).text;
        
        // Check if we're in a table line
        if (!lineText.trim().startsWith('|')) return;
        
        // Find the start and end of the table
        let tableStartLine = position.line;
        let tableEndLine = position.line;
        
        // Find the start of the table
        for (let i = position.line - 1; i >= 0; i--) {
            const currentLineText = document.lineAt(i).text;
            if (!currentLineText.trim().startsWith('|')) {
                break;
            }
            tableStartLine = i;
        }
        
        // Find the end of the table
        for (let i = position.line + 1; i < document.lineCount; i++) {
            const currentLineText = document.lineAt(i).text;
            if (!currentLineText.trim().startsWith('|')) {
                break;
            }
            tableEndLine = i;
        }
        
        // Get all table lines
        const tableLines = [];
        for (let i = tableStartLine; i <= tableEndLine; i++) {
            tableLines.push(document.lineAt(i).text);
        }
        
        // Extract cells from each line
        const table = tableLines.map(line => {
            return line.split('|')
                .map(cell => cell.trim())
                .filter((cell, index, array) => index > 0 && index < array.length - 1);
        });
        
        // Find the maximum width for each column
        const columnWidths: number[] = [];
        for (const row of table) {
            for (let i = 0; i < row.length; i++) {
                columnWidths[i] = Math.max(columnWidths[i] || 0, row[i].length);
            }
        }
        
        // Format the table
        const formattedTable = tableLines.map((line, rowIndex) => {
            // Check if it's a separator line
            const isSeparator = line.includes('+-') || line.includes('-+');
            
            if (isSeparator) {
                // Format separator line
                let formatted = '|';
                for (let i = 0; i < columnWidths.length; i++) {
                    formatted += '-'.repeat(columnWidths[i] + 2) + '|';
                }
                return formatted;
            } else {
                // Format regular line
                let formatted = '|';
                const cells = table[rowIndex];
                for (let i = 0; i < cells.length; i++) {
                    const padding = ' '.repeat(columnWidths[i] - cells[i].length);
                    formatted += ' ' + cells[i] + padding + ' |';
                }
                return formatted;
            }
        });
        
        // Replace the table in the document
        editor.edit(editBuilder => {
            const range = new vscode.Range(
                new vscode.Position(tableStartLine, 0),
                new vscode.Position(tableEndLine, document.lineAt(tableEndLine).text.length)
            );
            editBuilder.replace(range, formattedTable.join('\n'));
        });
    });

    let createTableCommand = vscode.commands.registerCommand('org-mode.createTable', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        // Ask for number of columns and rows
        const columns = await vscode.window.showInputBox({
            prompt: 'Enter number of columns',
            placeHolder: '3',
            validateInput: text => {
                return /^\d+$/.test(text) && parseInt(text) > 0 ? null : 'Please enter a positive number';
            }
        });
        
        if (!columns) return;
        
        const rows = await vscode.window.showInputBox({
            prompt: 'Enter number of rows',
            placeHolder: '3',
            validateInput: text => {
                return /^\d+$/.test(text) && parseInt(text) > 0 ? null : 'Please enter a positive number';
            }
        });
        
        if (!rows) return;
        
        const numColumns = parseInt(columns);
        const numRows = parseInt(rows);
        
        // Create the empty table structure
        let tableText = '';
        
        // Table header
        tableText += '|';
        for (let i = 0; i < numColumns; i++) {
            tableText += '     |';
        }
        tableText += '\n';
        
        // Table separator
        tableText += '|';
        for (let i = 0; i < numColumns; i++) {
            tableText += '-----|';
        }
        tableText += '\n';
        
        // Table rows
        for (let i = 0; i < numRows; i++) {
            tableText += '|';
            for (let j = 0; j < numColumns; j++) {
                tableText += '     |';
            }
            if (i < numRows - 1) {
                tableText += '\n';
            }
        }
        
        // Insert the table at the current cursor position
        const position = editor.selection.active;
        editor.edit(editBuilder => {
            editBuilder.insert(position, tableText);
        }).then(() => {
            // Move cursor to the first cell
            const newPosition = new vscode.Position(position.line, 1);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });

    // Add these to context.subscriptions
    context.subscriptions.push(
        moveToNextCellCommand,
        moveToPreviousCellCommand,
        formatTableCommand,
        createTableCommand
    );

}

export function deactivate() {
    // No need to explicitly clean up the decoration types as they will be disposed
    // when the extension is deactivated
}