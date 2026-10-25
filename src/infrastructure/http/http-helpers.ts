export const authHeaders = (token: string) => ({ Authorization: 'Bearer ' + token });
export const queryDate = (date?: string) => (date ? '?date=' + encodeURIComponent(date) : '');
export const tablePath = (tableId: string) => '/tables/' + encodeURIComponent(tableId);
