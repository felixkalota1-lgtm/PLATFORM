MEDAH 1.0

  let me tell you exactly the app you are supposed to build. Firstly install AI from fire and any other ai that we might need for the following that will help the application in terms of building models for storage warehousing and getting automatic generated images on products which are uploaded to the application in bulk using Excel, this a sales a procurement market place type app for business to buy, and sell there products with an invetory section and warehouse 2d funtion to track where each product is stored the warehouse, and combined with transport system to track goods sold, a teats section for directors to view analytics, with muiltple uses per company or business, and filter to only search for companies, or indivdiald, an inquriy, quote and order making system between buyer and seller,so that they can Inquire by searching for goods or inquire by directly searching for a company or an individual who is registered to the application and start the process of procurement once they send the inquiry the seller receives the inquiry and is prompted to respond with a quotation if they have the good in stock once the response has been received they seller sends it back to the buyer to which they can respond with an order In real time, Each company or individual has got the provision to put their goods or services up for display into their inventory and there is a prompt where they can place the goods onto the market for everyone to see but the inventory is private only visible by the owner or the people which are assigned to that email under the admin for example sales manager procurement officer etc Artifacture that allows the user when adding goods to the inventory to add the goods in bulk using an Excel spreadsheet and let AI have a look at it so it can add it into the inventory to avoid different formats not loading the goods into the inventory also implement a cart system from the search of the marketplace on every product they should be add to cart prompt, Also a section where vendors can be saved for quick business maneuverability And on the cart they should be a pick vendor Segment if you are selling, But not when you are buying make it different the seller sees pick vendor and the buyer doesn't, Add a setting code inventory best line which ones the owner of the product when the quantity drops below a certain number, Add an inn up notification system when an inquiry has been received order and quotation and so on add analytics to show which goods are being sold the most and all other analytic information, Make it so that people can The able communicate with each other within the teams of the company for example the director can give out an order or he can make a request and also that other segments of the company can send requests out to the procurement section add an HR Department as well as to track the time book salary deadline employee salaries and everything involved with hour and also a provision for company documents and their expiry date with its function in up that warns the users of the app who are assigned to a row to make sure those documents are always renewed I don't know what to call them you should know that In the hour department there should be employee contracts initiation of employment length of contract and also when it will expire with a warning when the contracts left with one month of expiry showing prompts renew unsure let go and also a segment for posting job offerings for individuals who are looking for jobs companies should be able to post their job openings there as individuals can now search a keyword for example engineer or driver and that should link to the company's postings they should show experience needed field of work etc everything needed for job postings add that too Also company vehicle monitoring location systems due a system that will show when a new spare part was put into a truck for example average minutes or average distance before replacement and this should show a warning when it surpasses that time or distance this would be tracked through the tracking system, lastly make the app look professional and neat keep everything tidy do not over populate the dashboard pack everything in bigger folders and let it have dropped down abilities as there are a lot of features. Feel free to add any other sector that you might see is missing in order to run a company successfully, maybe the accounting? sector just a hint. add them all



Marketplace - Shopping cart, product grid, vendor profiles ✅
Inventory Management - Product storage, categories ✅
Warehouse - Multi-location, 3D function, stock transfers ✅
Procurement - Orders, requests, vendor management Plus back to back transportation of goods between warehouses within the same company
HR - Employees, contracts, payroll, attendance, job postings ✅
Accounting - Invoices, bills, expenses, reports ✅
Sales - Quotations system ✅
AI Services - Image generation (Hugging Face), Excel validation (Ollama) ✅
Notifications - Basic notification system ✅
Multi-tenant - Multiple companies/users per business ✅




NPM Commands Explained
Let me break down each npm command and what it does:

1️⃣ npm run dev ⚙️ Development Server
Status: ✅ Running on http://localhost:5173/

What it does:

Starts the Vite development server in your browser
Enables hot module replacement (HMR) - changes to code reload instantly without losing state
Watches all files for changes automatically
Creates an unoptimized, quick-to-load version for development
Shows errors in real-time in the browser and terminal
When to use:

During development (while coding)
Testing features locally
Debugging issues
Always running in the background
Example Output:

2️⃣ npm run build 📦 Production Build
Status: ✅ Ready to test

What it does:

Runs TypeScript compiler (tsc) to check for type errors
Bundles and optimizes all code for production
Minifies JavaScript (removes whitespace, shortens variable names)
Compresses CSS and images
Creates a dist folder with optimized files
Reduces bundle size by ~80-90% (e.g., 5MB → 500KB)
Output:

When to use:

Before deploying to production
Testing the final build locally
Checking bundle size
Creating deployable files
Key benefit: Your users get a tiny, fast-loading website

3️⃣ npm run preview 👁️ Preview Production Build
Status: ✅ Ready to test

What it does:

Takes the files from npm run build (the dist folder)
Serves them locally to simulate how they'll work in production
Runs a static file server (like a web server would)
Does NOT have hot reload (like production won't)
Helps you test before actual deployment
When to use:

After running npm run build
To verify the production build works correctly
To check performance of optimized code
Before deploying to your server
Process:

4️⃣ npm run lint 🔍 Code Quality Check
Status: ✅ Ready to test

What it does:

Runs ESLint (code quality tool)
Checks all TypeScript & JavaScript files
Looks for:
Syntax errors
Unused variables
Code style issues
Best practice violations
Security problems
Reports issues with line numbers and fixes
Example Output:

When to use:

Before committing code
In CI/CD pipelines (automated testing)
To catch bugs early
To maintain consistent code style
Benefits:

Catches bugs automatically
Enforces team coding standards
Improves code readability
5️⃣ npm install 📥 Install Dependencies
Status: ✅ Works with legacy-peer-deps

What it does:

Reads package.json to see what packages your project needs
Downloads all those packages from npm registry
Installs them into node_modules folder
Creates package-lock.json to lock versions (ensures consistency)
Sets up executable scripts in .bin
What gets created:

When to use:

When you first clone the project
When new packages are added to package.json
When you delete node_modules folder
After switching branches with different dependencies
The --legacy-peer-deps flag:

Tells npm to allow some packages with conflicting versions
Needed because React 18 and React 19 packages exist together
Without it: npm would error and refuse to install
📊 Typical Development Workflow
🎯 Quick Command Reference
Command	Purpose	Environment	Speed	Output
npm run dev	Development	Local machine	⚡ Fast	Running server
npm run build	Optimize code	Pre-deployment	🐢 Slow (1-2 min)	dist folder
npm run preview	Test build	Local machine	⚡ Fast	Preview server
npm run lint	Check code	Development	⚡ Fast	Error report
npm install	Setup	Initial setup	🐢 Slow (few min)	node_modules
💡 Pro Tips
Tip 1: Use dev while coding

Tip 2: Check before committing

Tip 3: Test production before deploying

Tip 4: Reinstall if broken



