﻿export interface QueryContext {
    BaseDirectory?: string;
    Data?: { [key: string]: any[] };
}

export interface Group {
    Key: any;
    Items: any[];
}