import enum

class Role(enum.Enum):
    super_admin = "super_admin"
    department_admin = "department_admin"
    department_member = "department_member"