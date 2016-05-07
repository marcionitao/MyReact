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
        this.state = {employees: [], attributes: [], pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
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
    /*
     In this section, we are making it possible to reload the entire list of employees when the page size is updated.
     To do so, we have moved things into loadFromServer().
    */

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

    // tag::create[]
    onCreate(newEmployee) {
        follow(client, root, ['employees']).then(employeeCollection => {
            return client({
                method: 'POST',
                path: employeeCollection.entity._links.self.href,
                entity: newEmployee,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, root, [
                {rel: 'employees', params: {'size': this.state.pageSize}}]);
        }).done(response => {
           // this.onNavigate(response.entity._links.last.href);
        });
    }
    // end::create[]

    // tag::delete[]
    onDelete(employee) {
        client({method: 'DELETE', path: employee._links.self.href}).done(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }
    // end::delete[]

    // tag::navigate[]
    /*Because a new page size causes changes to all the navigation links, it’s best to refetch the data and start
    from the beginning.*/
    onNavigate(navUri) {
        client({method: 'GET', path: navUri}).done(employeeCollection => {
            this.setState({
                employees: employeeCollection.entity._embedded.employees,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: employeeCollection.entity._links
            });
        });
    }

    // tag::update-page-size[]
    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }
    // end::update-page-size[]
    // end::navigate[]
    /*
     the render() function is invoked by the framework. The employee state data is included in creation of the
     <EmployeeList /> React component as an input parameter.
     */
    render() {
        return (
            <div>

                    <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                    <EmployeeList employees={this.state.employees}
                                  links={this.state.links}
                                  pageSize={this.state.pageSize}
                                  onNavigate={this.onNavigate}
                                  onDelete={this.onDelete}
                                  updatePageSize={this.updatePageSize}/>

            </div>
        )
    }
}
// end::app[]

// tag::create-dialog[]
class CreateDialog extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var newEmployee = {};
        this.props.attributes.forEach(attribute => {
            newEmployee[attribute] = ReactDom.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newEmployee);

        // clear out the dialog's inputs
        this.props.attributes.forEach(attribute => {
            ReactDom.findDOMNode(this.refs[attribute]).value = '';
        });

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
                <p key={attribute}>
                    <input type="text" placeholder={attribute} ref={attribute} className="field" />
                </p>
        );

        return (
            <div>
                <a href="#createEmployee">Create</a>

                <div id="createEmployee" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new employee</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}
// end::create-dialog[]

// tag::employee-list[]
class EmployeeList extends React.Component{
    /*
     Using JavaScript’s map function, "this.props.employees" is transformed from an array of "employee records" into
     an array of <Element /> React components
     */
    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    // tag::handle-page-size-updates[]
    handleInput(e) {
        e.preventDefault();
        var pageSize = ReactDom.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDom.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }
    // end::handle-page-size-updates[]

    // tag::handle-nav[]
    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }
    // end::handle-nav[]

    // tag::employee-list-render[]
    render() {
        var employees = this.props.employees.map(employee =>
                <Employee key={employee._links.self.href} employee={employee} onDelete={this.props.onDelete}/>
        );

        var navLinks = [];

        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Description</th>
                            <th></th>
                        </tr>
                    </tbody>
                    {employees}
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
    // end::employee-list-render[]
}
// end::employee-list[]

// tag::employee[]
class Employee extends React.Component{

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.employee);
    }

    render() {
        return (
            <tbody>
            <tr>
                <td>{this.props.employee.firstName}</td>
                <td>{this.props.employee.lastName}</td>
                <td>{this.props.employee.description}</td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
            </tbody>
        )
    }

}
// end::employee[]

// tag::render[]
ReactDom.render(<App />,document.getElementById('react'))


// end::render[]

