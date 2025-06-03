# TODOs

This our _"backlog"_. Contributions are highly welcome.

- Add an `.archignore` or similar a la `.gitignore` for files that should never be considered by our tests
- Auto generate an architecture documentation based on the tests
- Add a `.because(...)` function a la ArchUnit. Should be used for the error message in case of a failing test as well as for the above auto generate arch-docs
- Enable checking dependencies on node_module files too. However, this needs a careful eye regarding performance. Also keep caching issues in mind if solved via parameters for example.
- Check if its possible to "trick" the tests by using barrell files in a certain way for example. If so, write a guide on what to be careful with!
