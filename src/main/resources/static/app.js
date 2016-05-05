'use strict';

import  React from 'react';
import ReactDom from 'react-dom';

const follow = require('./follow'); // function to hop multiple links by "rel"
const client = require('./client');
const root = '/api';

/*
 In the App component, an array of employees is fetched from the Spring Data REST backend and stored in this component’s state data.
 */
class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {employees: []};
    }

    /*
    componentDidMount() {
        client({method: 'GET', path: '/api/employees'}).done(response => {
            this.setState({employees: response.entity._embedded.employees});
        });
    }
    */
    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    loadFromServer(pageSize) {
        follow(client, root, [
                {rel: 'employees', params: {size: pageSize}}]
        ).then(employeeCollection => {
                return client({
                    method: 'GET',
                    path: employeeCollection.entity._links.profile.href,
                    headers: {'Accept': 'application/schema+json'}
                }).then(schema => {
                    this.schema = schema.entity;
                    return employeeCollection;
                });
            }).done(employeeCollection => {
                this.setState({
                    employees: employeeCollection.entity._embedded.employees,
                    attributes: Object.keys(this.schema.properties),
                    pageSize: pageSize,
                    links: employeeCollection.entity._links});
            });
    }
    /*
     the render() function is invoked by the framework. The employee state data is included in creation of the
     <EmployeeList /> React component as an input parameter.
     */
    render() {
        return (
            <div>
                 <EmployeeList employees={this.state.employees}/>
            </div>
        )
    }
}
// end::app[]

// tag::employee-list[]
class EmployeeList extends React.Component{
    /*
     Using JavaScript’s map function, "this.props.employees" is transformed from an array of "employee records" into
     an array of <Element /> React components
     */
    render() {
        var employees = this.props.employees.map(employee =>
                <Employee key={employee._links.self.href} employee={employee}/>
        );
        return (
            <table>
                <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Description</th>
                </tr>
                {employees}
            </table>
        )
    }
}
// end::employee-list[]

// tag::employee[]
class Employee extends React.Component{
    render() {
        return (
            <tbody>
            <tr>
                <td>{this.props.employee.firstName}</td>
                <td>{this.props.employee.lastName}</td>
                <td>{this.props.employee.description}</td>
            </tr>
            </tbody>
        )
    }

}
// end::employee[]

// tag::render[]
ReactDom.render(<App />,document.getElementById('react'))


// end::render[]

