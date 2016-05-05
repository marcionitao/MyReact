package com.marcio;

import org.springframework.data.repository.PagingAndSortingRepository;

/*public interface EmployeeRepository extends CrudRepository<Employee, Long> {

}*/
/*
 adds extra options to set page size, and also adds navigational links to hop from page to page
 */
public interface EmployeeRepository extends PagingAndSortingRepository<Employee, Long> {

}