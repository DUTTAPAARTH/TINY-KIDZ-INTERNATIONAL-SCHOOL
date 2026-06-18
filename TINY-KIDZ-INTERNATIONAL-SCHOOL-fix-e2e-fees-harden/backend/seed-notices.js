const mongoose = require("mongoose");
const Notice = require("./models/Notice");
const User = require("./models/User");
require("dotenv").config();

const seedNotices = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Find an admin user to be the poster
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.error(
        "❌ No admin user found. Please create an admin user first.",
      );
      process.exit(1);
    }

    console.log(`Using admin: ${adminUser.name} (${adminUser.email})`);

    // Clear existing notices
    await Notice.deleteMany({});
    console.log("Cleared existing notices");

    // Sample notices
    const notices = [
      {
        title: "School Reopening Announcement",
        content:
          "Dear Parents and Students, we are pleased to announce that the school will reopen on Monday, March 10th, 2026. All students are expected to attend classes regularly.",
        postedBy: adminUser._id,
        audience: "All",
        priority: "Important",
      },
      {
        title: "Parent-Teacher Meeting",
        content:
          "A parent-teacher meeting is scheduled for March 15th, 2026 from 10:00 AM to 2:00 PM. Parents are requested to meet their ward's class teacher to discuss academic progress.",
        postedBy: adminUser._id,
        audience: "All",
        priority: "Important",
      },
      {
        title: "Staff Meeting - March 12th",
        content:
          "All teaching staff are required to attend a mandatory staff meeting on March 12th at 9:00 AM in the conference room. Agenda: Curriculum updates and exam schedules.",
        postedBy: adminUser._id,
        audience: "Teachers",
        priority: "Urgent",
      },
      {
        title: "Annual Sports Day Registration",
        content:
          "Registration for Annual Sports Day is now open! Students interested in participating should submit their names to their respective PE teachers by March 20th.",
        postedBy: adminUser._id,
        audience: "Students",
        priority: "Normal",
      },
      {
        title: "Library Renovation Notice",
        content:
          "The school library will be closed for renovation from March 13th to March 18th. Students can borrow books in advance. Digital resources remain accessible.",
        postedBy: adminUser._id,
        audience: "All",
        priority: "Normal",
      },
      {
        title: "Mid-Term Examination Schedule",
        content:
          "Mid-term examinations will be conducted from March 25th to March 30th, 2026. Detailed timetable will be shared with students and parents by March 15th.",
        postedBy: adminUser._id,
        audience: "All",
        priority: "Urgent",
      },
      {
        title: "Science Exhibition - Call for Projects",
        content:
          "Students of classes 9-12 are invited to participate in the Annual Science Exhibition on April 5th. Project submission deadline: March 22nd. Contact science department for guidelines.",
        postedBy: adminUser._id,
        audience: "Students",
        priority: "Normal",
      },
      {
        title: "Teacher Training Workshop",
        content:
          "A professional development workshop on 'Modern Teaching Methodologies' will be conducted on March 16th from 2:00 PM to 5:00 PM. All teachers are expected to attend.",
        postedBy: adminUser._id,
        audience: "Teachers",
        priority: "Important",
      },
      {
        title: "Uniform Inspection Week",
        content:
          "Uniform inspection will be conducted strictly from March 11th to March 15th. Students are advised to wear proper school uniform with ID cards daily.",
        postedBy: adminUser._id,
        audience: "Students",
        priority: "Normal",
      },
      {
        title: "Fee Payment Reminder",
        content:
          "This is a reminder to parents that quarterly fees for the term ending March 2026 should be paid by March 15th. Late payment will incur penalty charges.",
        postedBy: adminUser._id,
        audience: "All",
        priority: "Important",
      },
    ];

    // Insert notices
    const createdNotices = await Notice.insertMany(notices);
    console.log(`✅ Created ${createdNotices.length} notices`);

    // Display summary
    console.log("\nNotices created:");
    createdNotices.forEach((notice, index) => {
      console.log(
        `${index + 1}. ${notice.title} [${notice.priority}] - Audience: ${notice.audience}`,
      );
    });

    console.log("\n✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding notices:", error.message);
    process.exit(1);
  }
};

seedNotices();
