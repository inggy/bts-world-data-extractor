import { ReadStream } from "fs";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import { Dictionary, Indexable, ObjectConverterDefinition } from "../model/model";

export const convertToObject = <T extends Indexable>(inputFileName: string, conversionDefinition: ObjectConverterDefinition): Dictionary<T> => {
    const records = parse(fs.readFileSync(`./output/tmp/${inputFileName}`, 'utf-8'), {
        columns: true,
        delimiter: ","
    });
    const database: Dictionary<T> = {};

    records.forEach((row: any) => {
        const result: any = { id: "0" }

        Object.keys(conversionDefinition).forEach((key) => {
            result[key] = conversionDefinition[key](row);
        });

        database[result.id] = result;
    });
    return database;
}