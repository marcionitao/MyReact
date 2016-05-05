package com.marcio;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/*To work with this application, you need to pre-load it with some data like this:*/

@Component
public class DatabaseLoader implements CommandLineRunner {

    private final EmployeeRepository repository;

    @Autowired
    public DatabaseLoader(EmployeeRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... strings) throws Exception {
        //The run() method is invoked with command line arguments, loading up your data.
        this.repository.save(new Employee("Frodo", "Baggins", "ring bearer"));
    }
}
