/** A flight date as dd/mm/yyyy, whatever the browser's locale and time zone. */
export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { timeZone: "UTC" });
