# Employee Manager 
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

  ## Description
 . This is a Node.js command-line application for managing a company's employee database using a PostgreSQL backend. The application provides functionality to view, add, update, and delete employees, roles, and departments.. 
 . .

  ## Table of Contents 

- [Installation](#installation)
- [Usage](#usage)
- [Features](#Features)
- [Database Structure](#database-structure)
- [License](#license)


## Installation

1. **Clone the repository** :
   ```bash
   git clone https://git@github.com:moayed10111/Employee-Manager.git
   ```

2. **Navigate to the project dierctory** :
   ```bash
      cd employee-management-system
      ```
3. **Install dependencies** :
   ```bash
      npm install
      ```
4. **Setup up the PostgrSQL** :
- Create a PostgreSQL database.
- Run the SQL script to set up the necessary tables and relationships.
- Update the database connection details in connection.js.

5. **Run the application** :

   ```bash
      npm start
      ```
## Usage
 Once the application is running, you'll be presented with a command-line menu. Use the arrow keys to navigate and press Enter to select an option.
 - **View All Employees**: View a list of all employees in the database.
 - **Add Employee**: Add a new employee by providing their details.
 - **Update Employee Role**: Change the role of an existing employee.
 - **View All Roles**: View a list of all roles in the database.
 - **Add Role**: Add a new role to the database.
 - **View All Departments**: View a list of all departments in the database.
 - **Add Department**: Add a new department to the database.
 - **Delete Entity**: Choose to delete an employee, role, or department.
 - **Quit**: Exit the application.

## Features


- **View All Employees**: Displays a list of all employees, including their IDs, first and last names, job titles, departments, salaries, and managers.
- **Add Employee**: Prompts for employee information and adds the employee to the database.
- **Update Employee Role**: Updates an existing employee's role.
- **View All Roles**: Displays a list of all job roles, including the job title, department, and salary.
- **Add Role**: Prompts for role information and adds the role to the database.
- **View All Departments**: Displays a list of all departments.
- **Add Department**: Prompts for department name and adds the department to the database.
- **Delete Entity**: Allows deletion of employees, roles, or departments.


## Database Structure
   ### **Tables**:
   - #### **employe**
      - **id**: Primary Key
      - **first_name**: Employee's first name
      - **last_name**: Employee's last name
      - **role_id**: Foreign Key to the role table
      - **manager_id**: Foreign Key to another record in the employee table (self-referential)
      
   - #### **role**
      - **id**: Primary Key
      - **title**: Role title
      - **salary**: Salary for the role
      - **department_id**: Foreign Key to the department table
   
   - #### **department**
      - **id**: Primary Key
      - **name**: Department name


## Dependencies
   - **Node.js**: JavaScript runtime.
   - **Inquirer.js**: For interactive command-line prompts.
   - **pg**: PostgreSQL client for Node.js.


## License
  This project it licensed under [MIT](https://opensource.org/licenses/MIT).
  

## Questions
If you have any questions or would like to git in touch, please feel free to contact
me via email or visit my GitHub profile.

-Email: moayed10111@gmail.com

-GitHub: https://github.com/moayed10111

-App video link: https://go.screenpal.com/watch/cZj0VkV9M9l