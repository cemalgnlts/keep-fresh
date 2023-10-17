/**
 * 
 * @param {String} content HTML content
 * @param {String} key Argument names
 * @param {Object} args Arguments
 * @returns {String} New HTML content
 */
export function renderTemplate(content, key, args) {
    return Function(key, 'return `' + content + '`;')(...args);
}