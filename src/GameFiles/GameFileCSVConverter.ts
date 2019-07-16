import fs from 'fs';
import stringify from 'csv-stringify';

import { GameFileConversionConfig } from "../model/model";
import { writeDataToCSV } from './CSVFileWriter';


function isValidChar(char: String): boolean {
    if ((char >= "A" && char <= "z") || (char >= "0" && char <= "9") || char === "_" || char === "-" )  {
        return true;
    }
    return false; 
}

export const convertGameDataFile = (gameFileConfig: GameFileConversionConfig): void => {
    const {
        inputFileName,
        outputFileName,
        columnCount,
    } = gameFileConfig;

    fs.open(`./game_data/${inputFileName}`, 'r', function(err: any, fd:any) {
        if (err) throw err;

        let buffer = Buffer.alloc(1);
        
        let columnArray = [];
        let rowsArray = [];
        let wordBuffer = "";
        let indexFound = false;
        let prevCharacterValid = false;

        let inputByte = 0;
        do {
            inputByte = fs.readSync(fd, buffer, 0, 1, null);
            let char = String.fromCharCode(buffer[0]);
            if (inputByte !== 0 && isValidChar(char)) {
                wordBuffer += char;
                prevCharacterValid = true;
            } else {
                if ((wordBuffer.length !== 0 && indexFound) || wordBuffer === "index") {
                    columnArray.push(wordBuffer);
                    wordBuffer = "";
                    indexFound = true;
                } else if (prevCharacterValid) {
                    wordBuffer = "";
                }

                if (columnArray.length === columnCount) {
                    rowsArray.push([...columnArray]);
                    columnArray = [];
                }
                prevCharacterValid = false;
            }
        } while (inputByte !== 0);

        writeDataToCSV(`tmp/${outputFileName}`, rowsArray);

      });
}