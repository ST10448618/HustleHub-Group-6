// Raw role string -> the label people should see.
const ROLE_LABELS = {
  CLIENT: 'Client',
  FREELANCER: 'Freelancer',
  ADMIN: 'Admin'
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}