
exports.generateSignString = (orgName) => {
  if (!orgName) return;
  return "@" + orgName.toLowerCase().replace(/\s+/g, "");
};