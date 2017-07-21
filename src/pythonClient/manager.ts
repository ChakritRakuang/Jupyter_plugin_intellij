import * as intellij from 'intellij';
import { EventEmitter } from 'events';
import { formatErrorForLogging } from '../common/utils';
import { execPythonFileSync } from '../common/procUtils';
import { createDeferred } from '../common/helpers';
import { Kernel } from '@jupyterlab/services';
import { LanguageProviders } from '../common/languageProvider';
import { MessageParser } from '../jupyterServices/jupyter_client/resultParser';
import { ParsedIOMessage } from '../contracts';
import * as Rx from 'rx';
import { NotebookManager } from '../jupyterServices/notebook/manager';
import { ProgressBar } from '../display/progressBar';
import { KernelManagerImpl } from "../kernel-manager";
import { JupyterClientAdapter } from './jupyter_client/main';
import { JupyterClientKernel } from './jupyter_client/jupyter_client_kernel';
import { KernelRestartedError, KernelShutdownError } from './common/errors';

const semver = require('semver');

export class Manager extends KernelManagerImpl {

    public runCodeAsObservable(code: string, kernel: Kernel.IKernel): Rx.Observable<ParsedIOMessage> {
        return this.jupyterClient.runCode(code) as Rx.Observable<ParsedIOMessage>;
    }

    public runCode(code: string, kernel: Kernel.IKernel, messageParser: MessageParser): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let errorMessage = 'Failed to execute kernel startup code. ';
            this.jupyterClient.runCode(code).subscribe(result => {
                if (result.stream === 'stderr' && result.type === 'text' && typeof result.data['text/plain'] === 'string') {
                    this.outputChannel.appendLine(result.data['text/plain']);
                }
                if (result.stream === 'error' && result.type === 'text' && typeof result.message === 'string') {
                    errorMessage += 'Details: ' + result.message;
                }
                if (result.stream === 'status' && result.type === 'text' && result.data === 'error') {
                    this.outputChannel.appendLine(errorMessage);
                    intellij.window.showWarningMessage(errorMessage);
                }
            }, reason => {
                if (reason instanceof KernelRestartedError || reason instanceof KernelShutdownError) {
                    return resolve();
                }
                // It doesn't matter if startup code execution Failed
                // Possible they have placed some stuff that is invalid or we have some missing packages (e.g. matplot lib)
                this.outputChannel.appendLine(formatErrorForLogging(reason));
                intellij.window.showWarningMessage(errorMessage);
                resolve();
            }, () => {
                resolve();
            });
        });

    }

    constructor(outputChannel: intellij.OutputChannel, notebookManager: NotebookManager, jupyterClient: JupyterClientAdapter) {
        super(outputChannel, notebookManager, jupyterClient);
    }

    private getNotebook() {
        return this.notebookManager.getNotebook();
    }

    public async startKernel(kernelSpec: Kernel.ISpecModel, language: string): Promise<Kernel.IKernel> {
        this.destroyRunningKernelFor(language);
        const kernelInfo = await this.jupyterClient.startKernel(kernelSpec);
        const kernelUUID = kernelInfo[0];
        const config = kernelInfo[1];
        const connectionFile = kernelInfo[2];
        const kernel = new JupyterClientKernel(kernelUUID, kernelSpec, config, connectionFile, this.jupyterClient);
        this.setRunningKernelFor(language, kernel);
        await this.executeStartupCode(kernel.kernelSpec.language, kernel);
        return kernel;

    }
    public getKernelSpecsFromJupyter(): Promise<Kernel.ISpecModels> {
        return this.jupyterClient.getAllKernelSpecs();
    }
}