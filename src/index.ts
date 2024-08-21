import inquirer from "inquirer";
import { QueryResult } from "pg";
import { pool, connectToDb } from "./connection.js";

// Establish connection to the database
await connectToDb();

// *** Data Fetching Functions ***

// Fetches all department names
const fetchDepartments = async (): Promise<string[]> => {
  const query = "SELECT name FROM department;";
  const result: QueryResult = await pool.query(query);
  return result.rows.map((row) => row.name);
};

// Fetches all role titles
const fetchRoles = async (): Promise<string[]> => {
  const query = "SELECT title FROM role;";
  const result: QueryResult = await pool.query(query);
  return result.rows.map((row) => row.title);
};

// Fetches all managers' names
const fetchManagers = async (): Promise<string[]> => {
  const query = `
    SELECT first_name || ' ' || last_name AS manager_name 
    FROM employee
    WHERE manager_id IS NULL;
  `;
  const result: QueryResult = await pool.query(query);
  const managers = result.rows.map((row) => row.manager_name);
  managers.unshift("Null"); // Adds an option for no manager
  return managers;
};

// Fetches all employees' names
const fetchEmployees = async (): Promise<string[]> => {
  const query = `
    SELECT e.id, e.first_name || ' ' || e.last_name AS employee_name
    FROM employee e;
  `;
  const result: QueryResult = await pool.query(query);
  return result.rows.map((row) => row.employee_name);
};

// *** Action Functions ***

// Creates a new role in the database
const createRole = async (): Promise<void> => {
  const departments = await fetchDepartments();

  inquirer
    .prompt([
      {
        type: "input",
        name: "roleName",
        message: "What is the name of the role?",
      },
      {
        type: "number",
        name: "salary",
        message: "What is the salary of the role?",
      },
      {
        type: "list",
        name: "department",
        message: "Which department does the role belong to?",
        choices: departments,
      },
    ])
    .then((answers) => {
      const { roleName, salary, department } = answers;
      const addRoleQuery = `
        INSERT INTO role (title, salary, department_id)
        VALUES ($1, $2, (SELECT id FROM department WHERE name = $3));
      `;

      pool.query(
        addRoleQuery,
        [roleName, salary, department],
        (err: Error, _res: QueryResult) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Added ${roleName} to the database.`);
          }
          displayMenu();
        }
      );
    });
};

// Creates a new department in the database
const createDepartment = (): void => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "departmentName",
        message: "What is the name of your department?",
      },
    ])
    .then((answers) => {
      const { departmentName } = answers;
      const addDeptQuery = "INSERT INTO department (name) VALUES ($1);";

      pool.query(
        addDeptQuery,
        [departmentName],
        (err: Error, _res: QueryResult) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Added ${departmentName} to the database.`);
            displayMenu();
          }
        }
      );
    });
};

// Creates a new employee in the database
const createEmployee = async (): Promise<void> => {
  const managers = await fetchManagers();
  const roles = await fetchRoles();

  inquirer
    .prompt([
      {
        type: "input",
        name: "firstName",
        message: "What is the employee's first name?",
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
      },
      {
        type: "list",
        name: "employeeRole",
        message: "What is the employee's role?",
        choices: roles,
      },
      {
        type: "list",
        name: "manager",
        message: "Who is the employee's manager?",
        choices: managers,
      },
    ])
    .then(async (answers) => {
      const { firstName, lastName, employeeRole, manager } = answers;
      const managerId = manager === "Null" ? null : manager.split(" ");

      const addEmployeeQuery = `
        INSERT INTO employee (first_name, last_name, role_id, manager_id)
        VALUES ($1, $2, 
          (SELECT id FROM role WHERE title = $3 LIMIT 1), 
          (SELECT id FROM employee WHERE first_name = $4 AND last_name = $5 LIMIT 1)
        );
      `;

      try {
        await pool.query(addEmployeeQuery, [
          firstName,
          lastName,
          employeeRole,
          managerId ? managerId[0] : null,
          managerId ? managerId[1] : null,
        ]);
        console.log("Employee added successfully");
      } catch (error) {
        console.error("Error adding employee:", error);
      }
      displayMenu();
    });
};

// Updates an employee's role in the database
const updateEmployeeRole = async (): Promise<void> => {
  const employees = await fetchEmployees();
  const roles = await fetchRoles();

  inquirer
    .prompt([
      {
        type: "list",
        name: "employee",
        message: "Which employee's role do you want to update?",
        choices: employees,
      },
      {
        type: "list",
        name: "role",
        message: "Which role do you want to assign the selected employee?",
        choices: roles,
      },
    ])
    .then((answers) => {
      const { employee, role } = answers;
      const [firstName, lastName] = employee.split(" ");
      const updateEmployeeRoleQuery = `
        UPDATE employee
        SET role_id = (SELECT id FROM role WHERE title = $1 LIMIT 1)
        WHERE first_name = $2 AND last_name = $3;
      `;

      pool.query(
        updateEmployeeRoleQuery,
        [role, firstName, lastName],
        (err: Error, _res: QueryResult) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Updated employee's role in the database.`);
          }
          displayMenu();
        }
      );
    });
};

// Deletes an entity (Employee, Role, or Department) from the database
const deleteEntity = async (): Promise<void> => {
  const entityChoices = ["Employee", "Role", "Department"];

  inquirer
    .prompt([
      {
        type: "list",
        name: "entity",
        message: "Which entity would you like to delete?",
        choices: entityChoices,
      },
    ])
    .then(async (answers) => {
      const { entity } = answers;

      switch (entity) {
        case "Employee":
          const employees = await fetchEmployees();
          inquirer
            .prompt([
              {
                type: "list",
                name: "employee",
                message: "Which employee would you like to delete?",
                choices: employees,
              },
            ])
            .then(async (answers) => {
              const { employee } = answers;
              const [firstName, lastName] = employee.split(" ");
              const deleteEmployeeQuery = `
                DELETE FROM employee WHERE first_name = $1 AND last_name = $2;
              `;
              await pool.query(deleteEmployeeQuery, [firstName, lastName]);
              console.log(`Deleted employee: ${employee}`);
              displayMenu();
            });
          break;

        case "Role":
          const roles = await fetchRoles();
          inquirer
            .prompt([
              {
                type: "list",
                name: "role",
                message: "Which role would you like to delete?",
                choices: roles,
              },
            ])
            .then(async (answers) => {
              const { role } = answers;
              const deleteRoleQuery = `
                DELETE FROM role WHERE title = $1;
              `;
              await pool.query(deleteRoleQuery, [role]);
              console.log(`Deleted role: ${role}`);
              displayMenu();
            });
          break;

        case "Department":
          const departments = await fetchDepartments();
          inquirer
            .prompt([
              {
                type: "list",
                name: "department",
                message: "Which department would you like to delete?",
                choices: departments,
              },
            ])
            .then(async (answers) => {
              const { department } = answers;
              const deleteDepartmentQuery = `
                DELETE FROM department WHERE name = $1;
              `;
              await pool.query(deleteDepartmentQuery, [department]);
              console.log(`Deleted department: ${department}`);
              displayMenu();
            });
          break;

        default:
          break;
      }
    });
};

// *** Main Menu ***

const displayMenu = (): void => {
  inquirer
    .prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          "View All Employees",
          "Add Employee",
          "Update Employee Role",
          "View All Roles",
          "Add Role",
          "View All Departments",
          "Add Department",
          "Delete Entity",
          "Quit",
        ],
      },
    ])

    .then((answers) => {
      switch (answers.action) {
        case "View All Employees":
          const viewEmployees = `
                    SELECT 
                        e.id AS id, 
                        e.first_name, 
                        e.last_name, 
                        r.title AS title,
                        d.name AS department, 
                        r.salary, 
                        CONCAT(m.first_name, ' ', m.last_name) AS manager
                    FROM 
                        employee e
                    JOIN 
                        role r ON e.role_id = r.id
                    JOIN 
                        department d ON r.department_id = d.id
                    LEFT JOIN 
                        employee m ON e.manager_id = m.id;
                `;

          pool.query(viewEmployees, (err: Error, res: QueryResult) => {
            if (err) {
              console.error(err);
            } else {
              console.table(res.rows);
            }
            displayMenu();
          });
          break;
        case "Add Employee":
          createEmployee();

          break;
        case "Update Employee Role":
          updateEmployeeRole();

          break;
        case "View All Roles":
          const viewRoles = `
                    SELECT role.id, role.title, department.name AS department, role.salary
                    FROM role
                    JOIN department ON role.department_id = department.id;  
                `;

          pool.query(viewRoles, (err: Error, res: QueryResult) => {
            if (err) {
              console.error(err);
            } else {
              console.table(res.rows);
            }
            displayMenu();
          });
          break;
        case "Add Role":
          createRole();

          break;
        case "View All Departments":
          const viewDepartments = `
                    SELECT department.id as id,
                    department.name as name
                    FROM department;
                `;

          pool.query(viewDepartments, (err: Error, res: QueryResult) => {
            if (err) {
              console.error(err);
            } else {
              console.table(res.rows);
            }
            displayMenu();
          });

          break;

        case "Add Department":
          createDepartment();
          break;

        case "Delete Entity":
          deleteEntity();
          break;

        case "Quit":
          process.exit(0);
          break;
        default:
          break;
      }
    });
};

displayMenu();
