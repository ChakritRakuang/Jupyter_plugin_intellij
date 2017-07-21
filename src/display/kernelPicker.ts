import * as vscode from 'intellij';
import { Commands, PythonLanguage } from '../common/constants';
import { Kernel } from '@jupyterlab/services';

export class KernelPicker extends vscode.Disposable {
    private disposables: vscode.Disposable[];
    constructor() {
        super(() => { });
        this.disposables = [];
        this.registerCommands();
    }
    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }

    private registerCommands() {
        this.disposables.push(vscode.commands.registerCommand(Commands.Jupyter.Kernel.Select, this.selectkernel.bind(this)));
    }

    private selectkernel(language: string = PythonLanguage.language): Promise<Kernel.ISpecModel> {
        return new Promise<Kernel.ISpecModel>(resolve => {
            const command = language ? Commands.Jupyter.Get_All_KernelSpecs_For_Language : Commands.Jupyter.Get_All_KernelSpecs;
            vscode.commands.executeCommand(command, language).then((kernelSpecs: Kernel.ISpecModel[]) => {
                if (kernelSpecs.length === 0) {
                    return resolve();
                }
                KernelPicker.displayKernelPicker(kernelSpecs).then((kernelSpec: Kernel.ISpecModel) => {
                    if (kernelSpec) {
                        vscode.commands.executeCommand(Commands.Jupyter.StartKernelForKernelSpeck, kernelSpec, kernelSpec.language);
                    }
                });
            });
        });
    }
    private static async displayKernelPicker(kernelspecs: Kernel.ISpecModel[]): Promise<Kernel.ISpecModel> {
        const items = kernelspecs.map(spec => {
            return {
                label: spec.display_name,
                description: spec.language,
                detail: spec.argv.join(' '),
                kernelspec: spec
            };
        });
        let item = await vscode.window.showQuickPick(items, { placeHolder: 'Select a Kernel' });
        return (item && item.kernelspec) ? item.kernelspec : undefined;
    }
}