A6sp9s ( Accounts  and  Permissions )
==================================================

P9S (Permissions) Methods
-------------------------

*   ``` createP8n() ``` – To create platform permission
eg : admin,manager etc
usage : ``` P9s.createP8n(p8n) ```
p8n is string


*   ** ``` createCircles() ``` ** – To create circles
eg : sales department, hr department etc
usage : ``` P9s.createCircles(circle) ```
circle is string


*   ** ``` deleteP8n() ``` ** – To delete platform permission
usage : ``` P9s.deleteP8n(p8n) ```


*   ** ``` giveP9s() ``` ** – Give permissions to users.(adds new permissions)
usage : ``` P9s.giveP9s(users,p9s,circle) ```
users can be string/array
p9s can be string/array
circle is string
circle is optional. If (!circle) {circle = global circle}


*   ** ``` setUserP9s() ``` ** – Set user permissions.(to replace current permissions with new)
usage : ``` P9s.setUserP9s(users,p9s,circle) ```
users can be string/array
p9s can be string/array
circle is string
circle is optional. If (!circle) {circle = global circle}


*   ** ``` withdrawP9s() ``` ** – Withdraw permissions.
usage : ``` P9s.withdrawP9s(users,p9s,circle) ```
users can be string/array
p9s can be string/array
circle is string
circle is optional. If (!circle) {circle = global circle}


*   ** ``` checkP9s() ``` ** – To check if user has permissions.return a boolean
usage : ``` P9s.checkP9s(user,p9s,circle) ```
user should be string
p9s can be string/array
circle is string
circle is optional. If (!circle) {circle = global circle}

*   ** ``` getP9sForUser() ``` ** – Get all permissions the user has inside  a circle. Returns array
usage : ``` P9s.getP9sForUser(user,circle) ```
user should be string
circle is string
circle is optional. If (!circle) {circle = global circle}


*   ** ``` getAllP9s() ``` ** – Get all available permissions in the p9s db. Returns cursor.
usage : ``` P9s.getAllP9s() ```


*   ** ``` getUsersWithP8n() ``` ** – Returns a cursor of users with the given permissions inside a circle
usage : ``` P9s.getUsersWithP8n(p8n,circle) ```
p8n should be string
circle is string
circle is optional. If (!circle) {circle = global circle}


*   ** ``` getCirclesForUser() ``` ** – Returns an array of circles inside which the user has the given permission
usage : ``` P9s.getCirclesForUser(user,p8n) ```
user should be string
p8n should be string
