export function Workaround(sourceUrl: string): string {

    return `www.whateverorigin.org/get?url=${encodeURIComponent(sourceUrl)}&callback=?`;

}