import fs from "fs";
import parse from "csv-parse/lib/sync";
import { Dictionary, Indexable, ObjectConverterDefinition, ObjectConverterFilter } from "../model/model";


const alwaysIncludesFilter: ObjectConverterFilter = () => true;

export const convertToObject = <T extends Indexable>(
        inputFileName: string,
        conversionDefinition: ObjectConverterDefinition,
        rowFilter = alwaysIncludesFilter): Dictionary<T> => {
    const records = parse(fs.readFileSync(`./output/tmp/${inputFileName}`, 'utf-8'), {
        columns: true,
        delimiter: ","
    });
    const database: Dictionary<T> = {};

    records.forEach((row: any) => {
        if (rowFilter(row)) {
            const result: any = { id: "0" }
            Object.keys(conversionDefinition).forEach((key) => {
                result[key] = conversionDefinition[key](row);
            });
    
            database[result.id] = result;
        }
    });
    return database;
}