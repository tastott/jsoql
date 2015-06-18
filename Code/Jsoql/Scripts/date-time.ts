export function DatePart(part: string, dateString: string, keepOffset?: boolean) {

    var date = new Date(dateString);

    if (!date.valueOf()) return null;

    var timezone = dateString.match(/(-|\+)([0-2][0-9]):([0-6][0-9])$/);

    if (keepOffset && timezone) {
        var offsetMinutes = parseInt(timezone[1] + timezone[2]) * 60 + parseInt(timezone[3]);
        date = new Date(date.valueOf() + offsetMinutes * 60000);
    }

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