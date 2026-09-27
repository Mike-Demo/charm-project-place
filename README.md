# Book your session

Build this app using the HTML files referenced below. You can hotlink the images referenced in the HTML. The attached images are screenshots of the desired screens. Here are public links to the html of the screens which you should read and use to build the app:

1. https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzRjY2YyYmQwZGYwN2M0ZWViYzEzMDk5N2ZlEgsSBxDh_pr8qQcYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjYxODQ1NjE0NjkyOTg1MjM4MA&filename=&opi=89354086

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://charm-project-place.lovable.app

This project stays in sync with the [Lovable editor](https://lovable.dev/projects/32bdc8d3-4ce3-43ea-9a80-fe1034eda005).

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
## Environment & secret handling

- Do not commit `.env` files with real credentials. Use `.env.example` as the template for local setup.
- Local secrets should be stored in an untracked `.env` file; deployment secrets should be configured in your hosting/platform secret manager.
- The previously committed live payment client token must be manually rotated or revoked in the payment provider outside this repository.

