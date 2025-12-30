function getDateRange(filter) {
  const now = new Date();
  let start,
    end = now;

  switch (filter) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "lastWeek":
      start = new Date();
      start.setDate(now.getDate() - 7);
      break;
    case "lastMonth":
      start = new Date();
      start.setMonth(now.getMonth() - 1);
      break;
    default:
      start = new Date(0);
  }

  return { start, end };
}

module.exports = getDateRange;
