# Hi!

Let's create an app using supabase, prisma and fresh, deno way.

This project aims to use as much supabase as possible.
I will be using prisma to wrap up database-related things.
Fresh is here to wrap things up with the UI and I will wrap server api in trpc.

I will detach fresh and locally import it, because I will need one modification in order to improve DX.

# Setup time!

1. Supabase

* Sign up (supabase website)[https://supabase.com/].
* Create a project, save your database password in your password manager (don't use special characters).
* Create .env file, make it is gitignored, go to the supabase project, save:

```conf
SUPABASE_URL=project url
SUPABASE_DB_URI=connection string from settings/database
SUPABASE_PASS=password from the project setup
SUPABASE_API_PUBLIC=anon api key from the settings/api
SUPABASE_API_ADMIN=service api key from the settings/api
```

* In `SUPABASE_DB_URI` replace `[YOUR-PASSWORD]` with your project setup.

2. Prisma

I will submit a boilerplate that init gives, but you will have to kickoff prisma.

But first... push your code to the repository, it will make prisma setup easier.

* `deno run --unstable -A npm:prisma@^4.5 generate --data-proxy`
* `deno run -A npm:prisma@^4.5 db push`
