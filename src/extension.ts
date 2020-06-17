'use strict';

import * as vscode from 'vscode';
import axios from 'axios';

const getTextBeforeLineIndex = (document: vscode.TextDocument, position: vscode.Position): string => {
	//Galois has limitations over the text size that you can send
	const MAX_LINES_SUPPORTED = 30;
	//It's necessary to attach an startoftext token at the beggin of the document
	const documentText = "<|startoftext|>\n" + document.getText();
	const lineIndex = position.line + 1;
	const textBeforeLineArray = documentText.split('\n').slice(Math.max(0, lineIndex - MAX_LINES_SUPPORTED), lineIndex);
	return textBeforeLineArray.join('\n');
};

const getLineTextBeforeCursor = (document: vscode.TextDocument, position: vscode.Position): string => {
	return document.lineAt(position.line).text.substr(0, position.character);
};

export function activate(context: vscode.ExtensionContext) {
	console.log('Galois-autocompleter-plugin is now active!');

	let provider = vscode.languages.registerCompletionItemProvider({ language: 'python' }, {
		async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			const textBeforLineIndex = getTextBeforeLineIndex(document, position);
			const lineTextBeforeCursor = getLineTextBeforeCursor(document, position);
			const completeTextBeforeCursor = textBeforLineIndex + '\n' + lineTextBeforeCursor;
			const currentLineReplaceRange = new vscode.Range(
				new vscode.Position(position.line, lineTextBeforeCursor.length),
				new vscode.Position(position.line, document.lineAt(position.line).text.length));
			const apiUrl: any = vscode.workspace.getConfiguration('galois-autocompleter-plugin').get('apiUrl');

			try {
				const { data } = await axios.post(apiUrl, {
					"text": completeTextBeforeCursor
				});
				const items = data.result.map((suggestion: string) => {
					const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
					item.additionalTextEdits = [vscode.TextEdit.delete(currentLineReplaceRange)];
					item.insertText = suggestion;
					item.detail = "Galois Autocompleter";
					item.documentation = suggestion;
					return item;
				});
				return items;

			} catch (err) {
				console.error(err);
				vscode.window.showInformationMessage('Galois Autocompleter - ' + err + ' - Something went wrong while connecting to service: ' + apiUrl);
			}
			return [];
		}
	});

	context.subscriptions.push(provider);
}
