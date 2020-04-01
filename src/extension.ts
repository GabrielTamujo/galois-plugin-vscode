'use strict';

import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	
    console.log('Galois-autocompleter-plugin is now active!');

	let provider = vscode.languages.registerCompletionItemProvider({ language: 'python'}, {

		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			
			const lineIndex = position.line;

			const textArray = document.getText().split('\n');

			const textBeforeLineArray = textArray.slice(0, lineIndex);

			const textBeforeLineString = textBeforeLineArray.join('\n');

			const textLine = document.lineAt(lineIndex).text;

			const textLineBeforeCursor = document.lineAt(lineIndex).text.substr(0, position.character);

			const textBeforeCursor = textBeforeLineString + '\n' + textLineBeforeCursor;

			const currentLineReplaceRange = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, textLine.length));

			const apiUrl : any = vscode.workspace.getConfiguration('galois-autocompleter-plugin').get('apiUrl');

			try {
				const { data } = await axios.post(apiUrl, {
					"text":textBeforeCursor
				});

				const items = data.result.map((suggestion: string) =>{
					const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
					item.additionalTextEdits = [vscode.TextEdit.delete(currentLineReplaceRange)];
					item.insertText = textLineBeforeCursor + suggestion;
					item.detail = "Galois Autocompleter";
					item.documentation = suggestion;
					return item;
				}); 

				return items;

            } catch (err) {
				console.error(err); 
				vscode.window.showInformationMessage('Galois Autocompleter - ' + err + ' - Something went wrong while connecting to service: '
				 + apiUrl);
			}
			return[];
		}
	});

	context.subscriptions.push(provider);
}
