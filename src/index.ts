import inquirer from "inquirer";
import { QueryResult } from "pg";
import { pool, connectToDb } from "./connection.js";

await connectToDb();

const getDepartments = async (): Promise<string[]> => {
  const query = "SELECT name FROM department;";
  const result: QueryResult = await pool.query(query);
  return result.rows.map((row) => row.name);
};

const getRoles = async (): Promise<string[]> => {
  const query = "SELECT title FROM role;";
  const result: QueryResult = await pool.query(query);
  return result.rows.map((row) => row.title);
};

const getManagers = async (): Promise<string[]> => {
  const query = `
          SELECT first_name || ' ' || last_name AS manager_name 
          FROM employee
          WHERE manager_id IS NULL;
      `;
  const result: QueryResult = await pool.query(query);
  const managers = result.rows.map((row) => row.manager_name);
  managers.unshift("Null"); 
  return managers;
};

const getEmployees = async (): Promise<string[]> => {
  const query = `
        SELECT e.id, e.first_name || ' ' || e.last_name AS employee_name
        FROM employee e;
    `;
  const result: QueryResult = await pool.query(query);
  return result.rows.map((row) => row.employee_name);
};

const addRole = async (): Promise<void> => {
  const departments = await getDepartments();

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
          performActions();
        }
      );
    });
};

const addDepartment = (): void => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "departmentName",
        message: "What is the name of your department",
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
            performActions();
          }
        }
      );
    });
};

const addEmployee = async (): Promise<void> => {
  const managers = await getManagers();
  const roles = await getRoles();

  const addEmployeeQuery = `
    INSERT INTO employee (first_name, last_name, role_id, manager_id)
    VALUES ($1, $2, (SELECT id FROM role WHERE title = $3 LIMIT 1), 
    (SELECT id FROM employee WHERE first_name = $4 AND last_name = $5 LIMIT 1));
    `;

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
      performActions();
    });
};

const updateEmployee = async (): Promise<void> => {
  const employees = await getEmployees();
  const roles = await getRoles();

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
          performActions();
        }
      );
    });
};

const performActions = (): void => {
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
            performActions();
          });
          break;
        case "Add Employee":
          addEmployee();

          break;
        case "Update Employee Role":
          updateEmployee();

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
            performActions();
          });
          break;
        case "Add Role":
          addRole();

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
            performActions();
          });

          break;
        case "Add Department":
          addDepartment();

          break;
        case "Quit":
          process.exit(0);
          break;
        default:
          break;
      }
    });
};

performActions();
