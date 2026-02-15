function isAdmin(member, settings) {
  return member.roles.cache.has(settings.admin_role_id);
}

function isSupport(member, settings) {
  return member.roles.cache.has(settings.support_role_id) || isAdmin(member, settings);
}

module.exports = {
  isAdmin,
  isSupport
};
