import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseText } from './text-parser';
import { exec, spawnSync } from "child_process";
import * as request from 'request';

export default async function ExportAsPDF(provider) {
    const editor = vscode.window.activeTextEditor;
    const doc = editor.document;
    const text = doc.getText();
    //RebuildPhantomJS(); // Rebuild Phantom JS if required
    var pdf = require('html-pdf');
    var options = { format: 'Letter' };
    var destination;
    if (!doc.isUntitled)
        destination = doc.fileName+".pdf";
    else
        destination = 'temp.pdf'
    var html = await parseText('', text)
    var binary_path = path.join(__dirname, 'wkhtmltopdf_'+process.platform+'_'+process.arch);
    console.log("bin_path:", binary_path)
    if(fs.existsSync(binary_path) )
        convert(destination);
    else {
        var label = await vscode.window.showInformationMessage("This feature requires wkhtmltopdf\ndo you want to download", "Download")
        if (label != "Download")
            return
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Downloading wkhtmltopdf",
            // cancellable: true
            }, async (progress) => {
                progress.report({ message: 'Downloading wkhtmltopdf...'});
                await new Promise((resolve, reject) =>  {
                    const platform = process.platform;
                    const arch = process.arch;
                    const download_url = `https://github.com/joaompinto/asciidoctor-vscode/raw/master/wkhtmltopdf-bin/wkhtmltopdf-${platform}-${arch}.xz`
                    request(download_url, (error, response, body) => {
                        if(error)
                            return vscode.window.showErrorMessage(error);
                        console.log('error:', error); // Print the error if one occurred
                        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                        //console.log('body:', body); // Print the HTML for the Google homepage.
                        resolve()
                    })
                })
                progress.report({ message: 'Extracting.'});
            }
        )
    }
}

function convert(destination){
    console.log(__dirname);
    // Saving the JSON that represents the document to a temporary JSON-file.
    vscode.window.showInformationMessage(("Successfully converted to "+destination), "Open File").then((label: string) => {
        if (label == "Open File") {
            console.log("Opening file", process.platform);
            switch (process.platform)
            {
                case 'win32':
                    exec(`"${destination}"`);
                    break;
                case 'darwin':
                    exec(`"bash -c 'open "${destination}"'`);
                    break;
                case 'linux':
                    exec(`"bash -c 'xdg-oopen "${destination}"'`);
                    break;
                default:
                    vscode. window.showWarningMessage("Output type is not supported");
                    break;
            }
        }
    })
}