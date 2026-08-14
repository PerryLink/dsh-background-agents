/** CSS Modules compile to a hashed class map inside the client bundle. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
