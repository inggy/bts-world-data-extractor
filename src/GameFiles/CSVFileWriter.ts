import fs from 'fs';
import stringify from 'csv-stringify';

export const writeDataToCSV = (outputFileName: string, data: any[][]): Promise<void> => {
    return new Promise((resolve, reject) => {
        stringify(data, (err: any, records: any) => {
            if (err) reject();
    
            fs.writeFile(`./output/${outputFileName}`, records, function(err:any) {
                if(err) {
                    console.log(err);
                    reject();
                }
                console.log(`${outputFileName} = ${data.length} lines`);
                resolve();
            });
        });
    });
    
}