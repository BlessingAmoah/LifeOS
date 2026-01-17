import pool from '../../config/db';
import { getContainerClient, generateBlobSASUrl } from '../../config/azure';
import { v4 as uuidv4 } from 'uuid';

export interface IdentityItem {
  value: string;
  title?: string;
  description?: string;
}

export interface UpdateProfileData {
  full_name?: string;
  preferred_name?: string;
  location?: string;
  timezone?: string;
  phone_numbers?: string[];
  identity_statement?: string;
  life_pillars?: string[] | IdentityItem[];
  personal_rules?: string[] | IdentityItem[];
  strengths?: string[] | IdentityItem[];
  growth_areas?: string[] | IdentityItem[];
  vision_short_term?: string;
  vision_current_focus_theme?: string;
  vision_top_priorities?: string[];
  vision_season_of_life?: string;
  vision_long_term?: string;
  vision_career?: string;
  vision_lifestyle?: string;
  vision_financial?: string;
  vision_spiritual?: string;
  core_values?: string[] | IdentityItem[];
}

export interface ProfileResponse {
  fullName: string | null;
  preferredName: string | null;
  email: string;
  location: string | null;
  timezone: string | null;
  phoneNumbers: string[];
  identityStatement: string | null;
  lifePillars: string[] | IdentityItem[];
  personalRules: string[] | IdentityItem[];
  strengths: string[] | IdentityItem[];
  growthAreas: string[] | IdentityItem[];
  visionShortTerm: string | null;
  visionCurrentFocusTheme: string | null;
  visionTopPriorities: string[];
  visionSeasonOfLife: string | null;
  visionLongTerm: string | null;
  visionCareer: string | null;
  visionLifestyle: string | null;
  visionFinancial: string | null;
  visionSpiritual: string | null;
  coreValues: string[] | IdentityItem[];
  profileImageUrl: string | null;
  updatedAt: string | null;
}

export class UsersService {
  async getProfile(userId: string): Promise<ProfileResponse> {
    // Get profile with user email
    const result = await pool.query(
      `SELECT
        p.full_name,
        p.preferred_name,
        p.location,
        p.timezone,
        p.phone_numbers,
        p.identity_statement,
        p.life_pillars,
        p.personal_rules,
        p.strengths,
        p.growth_areas,
        p.vision_short_term,
        p.vision_current_focus_theme,
        p.vision_top_priorities,
        p.vision_season_of_life,
        p.vision_long_term,
        p.vision_career,
        p.vision_lifestyle,
        p.vision_financial,
        p.vision_spiritual,
        p.core_values,
        p.profile_image_url,
        p.updated_at,
        u.email
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create profile if it doesn't exist
      await pool.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
      // Get user email
      const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    return {
      fullName: null,
      preferredName: null,
      email: userResult.rows[0]?.email || '',
      location: null,
      timezone: null,
      phoneNumbers: [],
      identityStatement: null,
      lifePillars: [],
      personalRules: [],
      strengths: [],
      growthAreas: [],
      visionShortTerm: null,
      visionCurrentFocusTheme: null,
      visionTopPriorities: [],
      visionSeasonOfLife: null,
      visionLongTerm: null,
      visionCareer: null,
      visionLifestyle: null,
      visionFinancial: null,
      visionSpiritual: null,
      coreValues: [],
      profileImageUrl: null,
      updatedAt: null,
    };
    }

    const row = result.rows[0];
    
    // Generate SAS URL for profile image if it exists
    let profileImageUrl = row.profile_image_url;
    if (profileImageUrl) {
      try {
        profileImageUrl = generateBlobSASUrl(profileImageUrl, 24 * 7); // 7 days validity
      } catch (error) {
        console.error('Error generating SAS URL for profile image:', error);
        // Continue with original URL if SAS generation fails
      }
    }
    
    return {
      fullName: row.full_name,
      preferredName: row.preferred_name,
      email: row.email,
      location: row.location,
      timezone: row.timezone,
      phoneNumbers: row.phone_numbers || [],
      identityStatement: row.identity_statement,
      lifePillars: row.life_pillars || [],
      personalRules: row.personal_rules || [],
      strengths: row.strengths || [],
      growthAreas: row.growth_areas || [],
      visionShortTerm: row.vision_short_term,
      visionCurrentFocusTheme: row.vision_current_focus_theme,
      visionTopPriorities: row.vision_top_priorities || [],
      visionSeasonOfLife: row.vision_season_of_life,
      visionLongTerm: row.vision_long_term,
      visionCareer: row.vision_career,
      visionLifestyle: row.vision_lifestyle,
      visionFinancial: row.vision_financial,
      visionSpiritual: row.vision_spiritual,
      coreValues: row.core_values || [],
      profileImageUrl: profileImageUrl,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileResponse> {
    const {
      full_name,
      preferred_name,
      location,
      timezone,
      phone_numbers,
      identity_statement,
      life_pillars,
      personal_rules,
      strengths,
      growth_areas,
      vision_short_term,
      vision_current_focus_theme,
      vision_top_priorities,
      vision_season_of_life,
      vision_long_term,
      vision_career,
      vision_lifestyle,
      vision_financial,
      vision_spiritual,
      core_values,
    } = data;

    // Update profile with COALESCE to only update provided fields
    const result = await pool.query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           preferred_name = COALESCE($2, preferred_name),
           location = COALESCE($3, location),
           timezone = COALESCE($4, timezone),
           phone_numbers = COALESCE($5, phone_numbers),
           identity_statement = COALESCE($6, identity_statement),
           life_pillars = COALESCE($7, life_pillars),
           personal_rules = COALESCE($8, personal_rules),
           strengths = COALESCE($9, strengths),
           growth_areas = COALESCE($10, growth_areas),
           vision_short_term = COALESCE($11, vision_short_term),
           vision_current_focus_theme = COALESCE($12, vision_current_focus_theme),
           vision_top_priorities = COALESCE($13, vision_top_priorities),
           vision_season_of_life = COALESCE($14, vision_season_of_life),
           vision_long_term = COALESCE($15, vision_long_term),
           vision_career = COALESCE($16, vision_career),
           vision_lifestyle = COALESCE($17, vision_lifestyle),
           vision_financial = COALESCE($18, vision_financial),
           vision_spiritual = COALESCE($19, vision_spiritual),
           core_values = COALESCE($20, core_values),
           updated_at = NOW()
       WHERE user_id = $21
       RETURNING *`,
      [
        full_name,
        preferred_name,
        location,
        timezone,
        phone_numbers,
        identity_statement,
        life_pillars,
        personal_rules,
        strengths,
        growth_areas,
        vision_short_term,
        vision_current_focus_theme,
        vision_top_priorities,
        vision_season_of_life,
        vision_long_term,
        vision_career,
        vision_lifestyle,
        vision_financial,
        vision_spiritual,
        core_values,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Profile not found');
    }

    // Get user email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const row = result.rows[0];
    
    // Generate SAS URL for profile image if it exists
    let profileImageUrl = row.profile_image_url;
    if (profileImageUrl) {
      try {
        profileImageUrl = generateBlobSASUrl(profileImageUrl, 24 * 7); // 7 days validity
      } catch (error) {
        console.error('Error generating SAS URL for profile image:', error);
      }
    }

    return {
      fullName: row.full_name,
      preferredName: row.preferred_name,
      email: userResult.rows[0].email,
      location: row.location,
      timezone: row.timezone,
      phoneNumbers: row.phone_numbers || [],
      identityStatement: row.identity_statement,
      lifePillars: row.life_pillars || [],
      personalRules: row.personal_rules || [],
      strengths: row.strengths || [],
      growthAreas: row.growth_areas || [],
      visionShortTerm: row.vision_short_term,
      visionCurrentFocusTheme: row.vision_current_focus_theme,
      visionTopPriorities: row.vision_top_priorities || [],
      visionSeasonOfLife: row.vision_season_of_life,
      visionLongTerm: row.vision_long_term,
      visionCareer: row.vision_career,
      visionLifestyle: row.vision_lifestyle,
      visionFinancial: row.vision_financial,
      visionSpiritual: row.vision_spiritual,
      coreValues: row.core_values || [],
      profileImageUrl: profileImageUrl,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `profile-images/${userId}-${uuidv4()}.${fileExtension}`;

    try {
      // Upload to Azure Blob Storage
      const containerClient = await getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const blobUrl = blockBlobClient.url;

      // Generate SAS URL for secure access (valid for 7 days)
      const sasUrl = generateBlobSASUrl(blobUrl, 24 * 7);

      // Update profile with new image URL (store base URL, we'll generate SAS on retrieval)
      await pool.query(
        `UPDATE profiles 
         SET profile_image_url = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [blobUrl, userId]
      );

      // Return SAS URL for immediate use
      return sasUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload avatar');
    }
  }
}
