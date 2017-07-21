"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var intellij = require("intellij");
var main_1 = require("./display/main");
var kernelStatus_1 = require("./display/kernelStatus");
var constants_1 = require("./common/constants");
var codeLensProvider_1 = require("./editorIntegration/codeLensProvider");
var symbolProvider_1 = require("./editorIntegration/symbolProvider");
var utils_1 = require("./common/utils");
var codeHelper_1 = require("./common/codeHelper");
var kernel_manager_1 = require("./kernel-manager");
var resultParser_1 = require("./jupyterServices/jupyter_client/resultParser");
var languageProvider_1 = require("./common/languageProvider");
var Rx = require("rx");
var manager_1 = require("./jupyterServices/notebook/manager");
var manager_2 = require("./jupyterServices/manager");
var PyManager = require("./pythonClient/manager");
var helpers_1 = require("./common/helpers");
var main_2 = require("./pythonClient/jupyter_client/main");
// Todo: Refactor the error handling and displaying of messages
var Jupyter = (function (_super) {
    __extends(Jupyter, _super);
    function Jupyter(outputChannel) {
        var _this = _super.call(this, function () { }) || this;
        _this.outputChannel = outputChannel;
        _this.kernel = null;
        _this.disposables = [];
        _this.registerCommands();
        _this.registerKernelCommands();
        _this.messageParser = new resultParser_1.MessageParser(_this.outputChannel);
        _this.activate();
        return _this;
    }
    Jupyter.prototype.dispose = function () {
        this.kernelManager.dispose();
        this.disposables.forEach(function (d) { return d.dispose(); });
    };
    Jupyter.prototype.getKernelManager = function () {
        return this.createKernelManager();
    };
    Jupyter.prototype.createKernelManager = function () {
        var _this = this;
        if (this.kernelCreationPromise) {
            return this.kernelCreationPromise.promise;
        }
        this.kernelCreationPromise = helpers_1.createDeferred();
        kernel_manager_1.KernelManagerImpl.jupyterVersionWorksWithJSServices(this.outputChannel)
            .then(function (yes) {
            _this.jupyterVersionWorksWithJSServices = yes;
            if (yes) {
                _this.kernelManager = new manager_2.Manager(_this.outputChannel, _this.notebookManager);
            }
            else {
                var jupyterClient = new main_2.JupyterClientAdapter(_this.outputChannel, intellij.workspace.rootPath);
                _this.kernelManager = new PyManager.Manager(_this.outputChannel, _this.notebookManager, jupyterClient);
            }
            _this.kernelCreationPromise.resolve(_this.kernelManager);
            // This happend when user changes it from status bar
            _this.kernelManager.on('kernelChanged', function (kernel, language) {
                _this.onKernelChanged(kernel);
            });
        })
            .catch(function (error) {
            _this.kernelCreationPromise.reject(error);
            throw error;
        });
    };
    Jupyter.prototype.activate = function () {
        var _this = this;
        this.notebookManager = new manager_1.NotebookManager(this.outputChannel);
        this.disposables.push(this.notebookManager);
        this.createKernelManager();
        this.disposables.push(intellij.window.onDidChangeActiveTextEditor(this.onEditorChanged.bind(this)));
        this.codeLensProvider = new codeLensProvider_1.JupyterCodeLensProvider();
        var symbolProvider = new symbolProvider_1.JupyterSymbolProvider();
        this.status = new kernelStatus_1.KernelStatus();
        this.disposables.push(this.status);
        this.display = new main_1.JupyterDisplay(this.codeLensProvider, this.outputChannel);
        this.disposables.push(this.display);
        this.codeHelper = new codeHelper_1.CodeHelper(this.codeLensProvider);
        languageProvider_1.LanguageProviders.getInstance().on('onLanguageProviderRegistered', function (language) {
            _this.disposables.push(intellij.languages.registerCodeLensProvider(language, _this.codeLensProvider));
            _this.disposables.push(intellij.languages.registerDocumentSymbolProvider(language, symbolProvider));
        });
        this.handleNotebookEvents();
    };
    Jupyter.prototype.handleNotebookEvents = function () {
        var _this = this;
        this.notebookManager.on('onNotebookChanged', function (nb) {
            _this.display.setNotebook(nb, _this.notebookManager.canShutdown(nb));
        });
        this.notebookManager.on('onShutdown', function () {
            _this.getKernelManager().then(function (k) { return k.clearAllKernels(); });
            _this.onKernelChanged(null);
        });
    };
    Jupyter.prototype.hasCodeCells = function (document, token) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.codeLensProvider.provideCodeLenses(document, token).then(function (codeLenses) {
                resolve(Array.isArray(codeLenses) && codeLenses.length > 0);
            }, function (reason) {
                console.error('Failed to detect code cells in document');
                console.error(reason);
                resolve(false);
            });
        });
    };
    Jupyter.prototype.onEditorChanged = function (editor) {
        var _this = this;
        if (!editor || !editor.document) {
            return;
        }
        this.getKernelManager()
            .then(function (kernelManager) {
            var kernel = kernelManager.getRunningKernelFor(editor.document.languageId);
            if (_this.kernel !== kernel && (_this.kernel && kernel && _this.kernel.id !== kernel.id)) {
                return _this.onKernelChanged(kernel);
            }
        });
    };
    Jupyter.prototype.onKernelChanged = function (kernel) {
        var _this = this;
        if (kernel) {
            kernel.statusChanged.connect(function (sender, status) {
                // We're only interested in status of the active kernels
                if (_this.kernel && (sender.id === _this.kernel.id)) {
                    _this.status.setKernelStatus(status);
                }
            });
        }
        this.kernel = kernel;
        this.status.setActiveKernel(this.kernel);
    };
    Jupyter.prototype.executeCode = function (code, language) {
        var _this = this;
        return this.getKernelManager()
            .then(function (kernelManager) {
            var kernelToUse = kernelManager.getRunningKernelFor(language);
            if (kernelToUse) {
                if (!_this.kernel || kernelToUse.id !== _this.kernel.id) {
                    _this.onKernelChanged(kernelToUse);
                }
                return Promise.resolve(_this.kernel);
            }
            else {
                return kernelManager.startKernelFor(language).then(function (kernel) {
                    kernelManager.setRunningKernelFor(language, kernel);
                    return kernel;
                });
            }
        })
            .then(function () {
            return _this.executeAndDisplay(_this.kernel, code).catch(function (reason) {
                var message = typeof reason === 'string' ? reason : reason.message;
                intellij.window.showErrorMessage(message);
                _this.outputChannel.appendLine(utils_1.formatErrorForLogging(reason));
            });
        }).catch(function (reason) {
            var message = typeof reason === 'string' ? reason : reason.message;
            if (reason.xhr && reason.xhr.responseText) {
                message = reason.xhr && reason.xhr.responseText;
            }
            if (!message) {
                message = 'Unknown error';
            }
            _this.outputChannel.appendLine(utils_1.formatErrorForLogging(reason));
            intellij.window.showErrorMessage(message, 'View Errors').then(function (item) {
                if (item === 'View Errors') {
                    _this.outputChannel.show();
                }
            });
        });
    };
    Jupyter.prototype.executeAndDisplay = function (kernel, code) {
        var observable = this.executeCodeInKernel(kernel, code);
        return this.display.showResults(observable);
    };
    Jupyter.prototype.executeCodeInKernel = function (kernel, code) {
        var _this = this;
        if (this.jupyterVersionWorksWithJSServices) {
            return Rx.Observable.create(function (observer) {
                var future = kernel.requestExecute({ code: code });
                future.onDone = function () {
                    observer.onCompleted();
                };
                future.onIOPub = function (msg) {
                    _this.messageParser.processResponse(msg, observer);
                };
            });
        }
        else {
            return kernel_manager_1.KernelManagerImpl.runCodeAsObservable(code, kernel);
        }
    };
    Jupyter.prototype.executeSelection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeEditor, code, cellRange, selectedCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        activeEditor = intellij.window.activeTextEditor;
                        if (!activeEditor || !activeEditor.document) {
                            return [2 /*return*/, Promise.resolve()];
                        }
                        return [4 /*yield*/, this.codeHelper.getSelectedCode()];
                    case 1:
                        code = _a.sent();
                        return [4 /*yield*/, this.codeHelper.getActiveCell()];
                    case 2:
                        cellRange = _a.sent();
                        return [4 /*yield*/, languageProvider_1.LanguageProviders.getSelectedCode(activeEditor.document.languageId, code, cellRange)];
                    case 3:
                        selectedCode = _a.sent();
                        return [2 /*return*/, this.executeCode(selectedCode, activeEditor.document.languageId)];
                }
            });
        });
    };
    Jupyter.prototype.registerCommands = function () {
        var _this = this;
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.ExecuteRangeInKernel, function (document, range) {
            if (!document || !range || range.isEmpty) {
                return Promise.resolve();
            }
            var code = document.getText(range);
            return _this.executeCode(code, document.languageId);
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.ExecuteSelectionOrLineInKernel, this.executeSelection.bind(this)));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.Get_All_KernelSpecs_For_Language, function (language) {
            if (_this.kernelManager) {
                return _this.kernelManager.getAllKernelSpecsFor(language);
            }
            return Promise.resolve();
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.StartKernelForKernelSpeck, function (kernelSpec, language) {
            if (_this.kernelManager) {
                return _this.kernelManager.startKernel(kernelSpec, language);
            }
            return Promise.resolve();
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.StartNotebook, function () {
            _this.notebookManager.startNewNotebook();
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.ProvideNotebookDetails, function () {
            manager_1.inputNotebookDetails()
                .then(function (nb) {
                if (!nb) {
                    return;
                }
                _this.notebookManager.setNotebook(nb);
            });
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.SelectExistingNotebook, function () {
            manager_1.selectExistingNotebook()
                .then(function (nb) {
                if (!nb) {
                    return;
                }
                _this.notebookManager.setNotebook(nb);
            });
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.Notebook.ShutDown, function () {
            _this.notebookManager.shutdown();
        }));
    };
    Jupyter.prototype.registerKernelCommands = function () {
        var _this = this;
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Interrupt, function () {
            _this.kernel.interrupt();
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Restart, function () {
            if (_this.kernelManager) {
                _this.kernelManager.restartKernel(_this.kernel).then(function (kernel) {
                    kernel.getSpec().then(function (spec) {
                        _this.kernelManager.setRunningKernelFor(spec.language, kernel);
                    });
                    _this.onKernelChanged(kernel);
                });
            }
        }));
        this.disposables.push(intellij.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Shutdown, function (kernel) {
            kernel.getSpec().then(function (spec) {
                _this.kernelManager.destroyRunningKernelFor(spec.language);
                _this.onKernelChanged();
            });
        }));
    };
    return Jupyter;
}(intellij.Disposable));
exports.Jupyter = Jupyter;
