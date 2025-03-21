class AuthController {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async login(req, res) {
        const { username, password } = req.body;
        try {
            const user = await this.userModel.findUserByUsername(username);
            if (!user || !user.validatePassword(password)) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            // Logic for generating and sending a token can be added here
            res.status(200).json({ message: 'Login successful', user });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }

    async register(req, res) {
        const { username, password } = req.body;
        try {
            const existingUser = await this.userModel.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            const newUser = await this.userModel.createUser({ username, password });
            res.status(201).json({ message: 'User registered successfully', newUser });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }
}

export default AuthController;