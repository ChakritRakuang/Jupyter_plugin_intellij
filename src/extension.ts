'use strict';
import * as intellij from 'intellij';
import { Jupyter } from './main';
import { LanguageProvider, LanguageProviders } from './common/languageProvider';
import { sendTelemetryEvent } from './telemetry/main';
import { EVENT_LOAD } from './telemetry/contracts';

// Required by @jupyter/services
(global as any).XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
(global as any).requirejs = require('requirejs');
(global as any).WebSocket = require('ws');

export function activate(context: intellij.ExtensionContext) {
    sendTelemetryEvent(EVENT_LOAD);
    let outputChannel = intellij.window.createOutputChannel('Jupyter');
    context.subscriptions.push(outputChannel);

    let jupyter = new Jupyter(outputChannel);
    context.subscriptions.push(jupyter);

    return {
        registerLanguageProvider: (language: string, provider: LanguageProvider) => {
            LanguageProviders.registerLanguageProvider(language, provider);
        },
        hasCodeCells: (document: intellij.TextDocument, token: intellij.CancellationToken) => {
            return jupyter.hasCodeCells(document, token);
        }
    };
}

export function deactivate() {
}