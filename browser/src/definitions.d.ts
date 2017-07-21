declare type NotebookOutput = {
  id: string;
  value: { [key: string]: any } | string;
}
declare interface NotebookResultSettings {
  appendResults?: boolean;
}
declare type NotebookResultsState = NotebookOutput[];

declare let module: any;
declare let require: any;