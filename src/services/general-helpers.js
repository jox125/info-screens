// Trims and turns strings to lower case if needed
export function normalize(str, lowerCase = false) {
    str = str.trim();
    return lowerCase ? str.toLowerCase() : str;
}