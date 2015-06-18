export function DatePart(part: string, dateString: string, keepOffset?: boolean) {

    //var timezonePattern = /(-|+)([
    var date = new Date(dateString);

    if (!date.valueOf()) return null;

    //if(keepOffset && dateString.match(/

    switch (part.toLowerCase()) {
        case 'year': return date.getUTCFullYear();
        case 'month': return date.getUTCMonth() + 1;
        case 'day': return date.getUTCDate();
        case 'hour': return date.getUTCHours();
        case 'minute': return date.getUTCMinutes();
        case 'second': return date.getUTCSeconds();
        default:
            throw new Error(`Unrecognized date part: '${part}'`);
    }
}