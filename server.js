const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient(); // Database client

app.get("/", async (req, res) => {
    res.send("Bitespeed Backend Task is running!");
});

// Test DB connection
app.get("/test-db", async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany();
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: "Database connection failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.post("/identify", async (req, res) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: "At least one of email or phoneNumber is required" });
    }

    try {
        // Step 1: Find existing contacts that match the given email or phoneNumber
        const existingContacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ]
            }
        });

        if (existingContacts.length === 0) {
            // Step 2: No matching contacts, create a new primary contact
            const newContact = await prisma.contact.create({
                data: {
                    email: email || null,
                    phoneNumber: phoneNumber || null,
                    linkPrecedence: "primary"
                }
            });

            return res.json({
                contact: {
                    primaryContactId: newContact.id,
                    emails: [newContact.email].filter(Boolean),
                    phoneNumbers: [newContact.phoneNumber].filter(Boolean),
                    secondaryContactIds: []
                }
            });
        }

        // Step 3: Identify primary contacts
        let primaryContacts = existingContacts.filter(c => c.linkPrecedence === "primary");

        if (primaryContacts.length > 1) {
            // 🔴 Two separate primary contacts exist → Merge them
            primaryContacts.sort((a, b) => a.createdAt - b.createdAt); // Oldest one becomes primary
            const [oldPrimary, newSecondary] = primaryContacts;

            await prisma.contact.update({
                where: { id: newSecondary.id },
                data: { linkedId: oldPrimary.id, linkPrecedence: "secondary" }
            });

            existingContacts.forEach(c => {
                if (c.linkedId === newSecondary.id) {
                    c.linkedId = oldPrimary.id; // Update references
                }
            });
        }

        // Step 4: Identify the final primary contact
        const primaryContact = existingContacts.find(c => c.linkPrecedence === "primary") || existingContacts[0];
        const secondaryContacts = existingContacts.filter(c => c.id !== primaryContact.id);

        // Step 5: If new information is provided, create a secondary contact
        const isNewEmail = email && !existingContacts.some(c => c.email === email);
        const isNewPhone = phoneNumber && !existingContacts.some(c => c.phoneNumber === phoneNumber);

        if (isNewEmail || isNewPhone) {
            const newContact = await prisma.contact.create({
                data: {
                    email: isNewEmail ? email : null,
                    phoneNumber: isNewPhone ? phoneNumber : null,
                    linkedId: primaryContact.id,
                    linkPrecedence: "secondary"
                }
            });
            secondaryContacts.push(newContact);
        }

        // Step 6: Prepare the response format
        const response = {
            contact: {
                primaryContactId: primaryContact.id,
                emails: [primaryContact.email, ...secondaryContacts.map(c => c.email)].filter(Boolean),
                phoneNumbers: [primaryContact.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)].filter(Boolean),
                secondaryContactIds: secondaryContacts.map(c => c.id)
            }
        };

        res.json(response);
    } catch (error) {
        console.error("Error in /identify:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});