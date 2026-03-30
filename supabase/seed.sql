-- Seed data for local development
-- Mirrors mock/topics.ts subjects for consistency
-- Root node IDs: c1..01 (Surfing), c1..02 (Nuclear), c1..03 (Jazz)

-- Topics
INSERT INTO topics (id, title, emoji, created_at, last_visited_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Surfing', '🏄', now() - interval '7 days', now() - interval '2 hours'),
  ('a1000000-0000-0000-0000-000000000002', 'Nuclear Power', '⚛️', now() - interval '14 days', now() - interval '1 day'),
  ('a1000000-0000-0000-0000-000000000003', 'The History of Jazz', '🎷', now() - interval '3 days', now() - interval '30 minutes');

-- Versions (initial snapshots)
INSERT INTO versions (id, topic_id, snapshot, action) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '{}', 'create_topic'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', '{}', 'create_topic'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', '{}', 'create_topic');

-- Surfing nodes
INSERT INTO nodes (id, topic_id, parent_id, version_id, label, emoji, color, summary, depth, sort_order, sources) VALUES
  -- Root (H1)
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', NULL, 'b1000000-0000-0000-0000-000000000001',
   'Surfing', '🏄', '#4F46E5',
   'Surfing is a surface water sport in which an individual uses a board to ride on the forward section of a moving wave of water. Originating in Polynesian culture, surfing has evolved from ancient ritual to global phenomenon. Modern surfing encompasses shortboarding, longboarding, big wave riding, and tow-in surfing. The sport is deeply connected to ocean science, weather patterns, and coastal geography.',
   1, 0, '[]');
INSERT INTO nodes (topic_id, parent_id, version_id, label, emoji, color, summary, depth, sort_order, sources) VALUES
  -- H2 branches (parent = root)
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'Origins & History', '🌺', '#EC4899',
   'Surfing originated in Polynesia, with the earliest evidence dating to 12th-century cave paintings in Hawaii. Known as heʻe nalu ("wave sliding"), it was central to Hawaiian culture and social hierarchy. Chiefs surfed the best breaks on longer boards, while commoners used shorter ones. Captain Cook documented surfing in 1778, and missionaries nearly eradicated it in the 1800s. Duke Kahanamoku revived and globalized the sport in the early 20th century, demonstrating surfing in Australia and California.',
   2, 0, '[{"title": "History of Surfing", "url": "https://en.wikipedia.org/wiki/History_of_surfing"}]'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'How Waves Work', '🌊', '#3B82F6',
   'Waves are created by wind energy transferring to the ocean surface, often thousands of miles from shore. As swells travel across open ocean, they organize into sets with predictable intervals. When a swell hits shallow water, the bottom of the wave slows while the top continues, causing the wave to steepen and break. The shape of the ocean floor — reef, sand, or point — determines how the wave breaks. Surfers read swell direction, period, and height from buoy data and forecasts.',
   2, 1, '[{"title": "How Ocean Waves Work", "url": "https://oceanservice.noaa.gov/education/tutorial_waves/"}]'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'Board Design & Equipment', '🛹', '#F59E0B',
   'Surfboard design has evolved dramatically from solid wood planks to lightweight foam and fiberglass constructions. Key variables include length, width, thickness, rocker (curve), and fin setup. Shortboards (5-7 feet) offer maneuverability, longboards (8-10 feet) provide stability and glide. Modern innovations include epoxy construction, carbon fiber reinforcement, and computer-shaped rails. Wetsuits, leashes, and wax complete the essential equipment.',
   2, 2, '[{"title": "Surfboard Design", "url": "https://en.wikipedia.org/wiki/Surfboard"}]'),
  ('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'Famous Breaks & Competitions', '🏆', '#10B981',
   'The world''s most famous surf breaks include Pipeline on Oahu''s North Shore, Teahupoʻo in Tahiti, Jeffreys Bay in South Africa, and Mavericks in California. The World Surf League (WSL) Championship Tour visits 10-12 locations annually. Surfing debuted as an Olympic sport at the 2020 Tokyo Games. Big wave surfing pushes boundaries with riders tackling 60-80 foot waves at Nazaré, Portugal, now the recognized home of the largest waves ever surfed.',
   2, 3, '[{"title": "World Surf League", "url": "https://www.worldsurfleague.com/"}]');

-- Nuclear Power nodes
INSERT INTO nodes (id, topic_id, parent_id, version_id, label, emoji, color, summary, depth, sort_order, sources) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', NULL, 'b1000000-0000-0000-0000-000000000002',
   'Nuclear Power', '⚛️', '#4F46E5',
   'Nuclear power generates approximately 10% of the world''s electricity through controlled nuclear fission reactions. First harnessed for civilian energy in the 1950s, nuclear technology remains one of the most debated energy sources. It produces massive amounts of carbon-free electricity but raises concerns about safety, waste disposal, and proliferation. Modern reactor designs aim to address these challenges.',
   1, 0, '[]');
INSERT INTO nodes (topic_id, parent_id, version_id, label, emoji, color, summary, depth, sort_order, sources) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'How Fission Works', '💥', '#EF4444',
   'Nuclear fission splits heavy atomic nuclei (typically uranium-235 or plutonium-239) into lighter elements, releasing enormous energy. A single uranium fuel pellet contains as much energy as a ton of coal. In a reactor, controlled chain reactions heat water to produce steam, which drives turbines to generate electricity. Control rods absorb neutrons to regulate the reaction rate. The process produces no direct carbon emissions during operation.',
   2, 0, '[{"title": "Nuclear Fission", "url": "https://en.wikipedia.org/wiki/Nuclear_fission"}]'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'Safety & Major Incidents', '🛡️', '#F59E0B',
   'Three major nuclear accidents have shaped public perception: Three Mile Island (1979), Chernobyl (1986), and Fukushima (2011). Each led to significant safety improvements in reactor design and regulatory oversight. Modern reactors incorporate passive safety systems that function without human intervention or electrical power. The nuclear industry now has one of the lowest fatality rates per unit of energy produced of any major power source.',
   2, 1, '[{"title": "Nuclear Safety", "url": "https://world-nuclear.org/nuclear-essentials/what-about-nuclear-safety"}]'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'Waste & Storage', '🗑️', '#8B5CF6',
   'Nuclear waste is categorized into low, intermediate, and high-level waste. High-level waste (spent fuel) remains radioactive for thousands of years and requires deep geological disposal. Finland''s Onkalo facility is the world''s first permanent deep geological repository, designed to safely contain waste for 100,000 years. Reprocessing technology can recycle 96% of spent fuel, though it remains controversial due to proliferation concerns.',
   2, 2, '[{"title": "Nuclear Waste", "url": "https://en.wikipedia.org/wiki/Nuclear_waste"}]'),
  ('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'Future Reactor Designs', '🚀', '#10B981',
   'Next-generation reactors include small modular reactors (SMRs) that can be factory-built and shipped to site, molten salt reactors that operate at atmospheric pressure, and fusion reactors that aim to replicate the sun''s energy process. Companies like NuScale, TerraPower (founded by Bill Gates), and Commonwealth Fusion Systems are leading development. SMRs could provide flexible, scalable nuclear power to remote areas and industrial facilities.',
   2, 3, '[{"title": "Generation IV Reactors", "url": "https://en.wikipedia.org/wiki/Generation_IV_reactor"}]');

-- Jazz nodes
INSERT INTO nodes (id, topic_id, parent_id, version_id, label, emoji, color, summary, depth, sort_order, sources) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', NULL, 'b1000000-0000-0000-0000-000000000003',
   'The History of Jazz', '🎷', '#4F46E5',
   'Jazz is an American musical art form that originated in the early 20th century in African American communities of New Orleans. It blends African rhythmic traditions, blues, ragtime, and European harmonic structures into a uniquely improvisational genre. Jazz has continuously evolved through distinct eras, influencing virtually every form of popular music that followed.',
   1, 0, '[]');
INSERT INTO nodes (topic_id, parent_id, version_id, label, emoji, color, summary, depth, sort_order, sources) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'New Orleans Origins', '🎺', '#DC2626',
   'Jazz emerged in New Orleans around 1900, born from the convergence of African musical traditions, blues, ragtime, brass band marches, and the city''s unique cultural mixing. Congo Square was a gathering place where enslaved people maintained African drumming traditions. Early pioneers like Buddy Bolden, Jelly Roll Morton, and King Oliver created a new sound characterized by collective improvisation, syncopated rhythms, and blue notes.',
   2, 0, '[{"title": "Jazz Origins", "url": "https://en.wikipedia.org/wiki/Jazz#Origins"}]'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'The Swing Era', '💃', '#F59E0B',
   'The 1930s-40s Swing Era made jazz America''s popular music. Big bands led by Duke Ellington, Count Basie, and Benny Goodman played danceable arrangements for massive audiences. The Savoy Ballroom in Harlem became the epicenter of swing culture. This era also saw jazz break racial barriers — Goodman''s integrated band was groundbreaking. Swing bands employed intricate arrangements while leaving space for virtuosic solos.',
   2, 1, '[{"title": "Swing Music", "url": "https://en.wikipedia.org/wiki/Swing_music"}]'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'Bebop Revolution', '🎹', '#8B5CF6',
   'In the 1940s, Charlie Parker, Dizzy Gillespie, and Thelonious Monk created bebop — a complex, virtuosic style that reclaimed jazz as an art form rather than dance music. Bebop featured rapid tempos, intricate harmonic progressions, and dazzling improvisation. It was deliberately challenging, pushing boundaries of melody and rhythm. The small combo format replaced big bands, emphasizing individual expression over orchestrated arrangements.',
   2, 2, '[{"title": "Bebop", "url": "https://en.wikipedia.org/wiki/Bebop"}]'),
  ('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'Modern Jazz & Legacy', '🌍', '#10B981',
   'Post-bebop jazz branched into cool jazz (Miles Davis, Dave Brubeck), hard bop (Art Blakey, Horace Silver), free jazz (Ornette Coleman, John Coltrane), and fusion (Herbie Hancock, Weather Report). Each era pushed musical boundaries further. Today, artists like Kamasi Washington, Robert Glasper, and Esperanza Spalding blend jazz with hip-hop, electronic music, and R&B, keeping the tradition of innovation alive. Jazz remains the foundation of American musical improvisation.',
   2, 3, '[{"title": "Jazz", "url": "https://en.wikipedia.org/wiki/Jazz"}]');
