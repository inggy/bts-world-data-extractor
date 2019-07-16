import fs from 'fs';
import stringify from 'csv-stringify';

export const writeDataToCSV = (outputFileName: string, data: any[][]) => {
    stringify(data, (err: any, records: any) => {
        if (err) throw err;

        fs.writeFile(`./output/${outputFileName}`, records, function(err:any) {
            if(err) {
                return console.log(err);
            }
            console.log(`${outputFileName} = ${data.length} lines`);
        });
    });
}