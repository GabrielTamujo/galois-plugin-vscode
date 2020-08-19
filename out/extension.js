'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const axios_1 = require("axios");
const { CompletionItemKind } = require("vscode");
const triggers = [
    ' ',
    '.',
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    ',',
    ':',
    '\'',
    '"',
    '=',
    '<',
    '>',
    '/',
    '\\',
    '+',
    '-',
    '|',
    '&',
    '*',
    '%',
    '=',
    '$',
    '#',
    '@',
    '!',
];
const DEFAULT_DETAIL = 'Galois Autocompleter';
const getTextBeforeLineIndex = (document, position) => {
    //It's necessary to attach an startoftext token at the beggining of the document
    const documentText = "<|startoftext|>\n" + document.getText();
    const lineIndex = position.line + 1;
    const textBeforeLineArray = documentText.split('\n').slice(0, lineIndex);
    return textBeforeLineArray.join('\n');
};
const getLineTextBeforeCursor = (document, position) => {
    return document.lineAt(position.line).text.substr(0, position.character);
};
function activate(context) {
    console.log('Galois-autocompleter-plugin is now active!');
    let provider = vscode.languages.registerCompletionItemProvider({ pattern: '**' }, {
        provideCompletionItems(document, position, token, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const textBeforeLineIndex = getTextBeforeLineIndex(document, position);
                const lineTextBeforeCursor = getLineTextBeforeCursor(document, position);
                const completeTextBeforeCursor = textBeforeLineIndex + '\n' + lineTextBeforeCursor;
                const currentLineReplaceRange = new vscode.Range(new vscode.Position(position.line, lineTextBeforeCursor.length), new vscode.Position(position.line, document.lineAt(position.line).text.length));
                const apiUrl = vscode.workspace.getConfiguration('galois-autocompleter-plugin').get('apiUrl');
                try {
                    const { data } = yield axios_1.default.post(apiUrl, {
                        "text": completeTextBeforeCursor
                    });
                    const items = data.result.map((suggestion) => {
                        const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Property);
                        item.filterText = document.getText(currentLineReplaceRange);
                        item.range = currentLineReplaceRange;
                        item.insertText = new vscode.SnippetString(suggestion);
                        item.detail = DEFAULT_DETAIL;
                        item.documentation = suggestion;
                        return item;
                    });
                    return items;
                }
                catch (err) {
                    console.error(err);
                    vscode.window.showInformationMessage('Galois Autocompleter - ' + err + ' - Something went wrong while connecting to service: ' + apiUrl);
                }
                return [];
            });
        }
    }, ...triggers);
    context.subscriptions.push(provider);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map