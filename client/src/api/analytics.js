import axios from './axios';

/**
 * Fetch analytics summary (Tier 1 headline stats)
 */
export const getSummary = async (params = {}) => {
  const { data } = await axios.get('/analytics/summary', { params });
  return data;
};

/**
 * Fetch cumulative funnel stages counts
 */
export const getFunnel = async (params = {}) => {
  const { data } = await axios.get('/analytics/funnel', { params });
  return data;
};

/**
 * Fetch stats grouped by department
 */
export const getByDepartment = async (params = {}) => {
  const { data } = await axios.get('/analytics/by-department', { params });
  return data;
};

/**
 * Fetch Placed vs Unplaced students count inside CGPA ranges
 */
export const getCgpaDistribution = async (params = {}) => {
  const { data } = await axios.get('/analytics/cgpa-distribution', { params });
  return data;
};

/**
 * Fetch top companies by offer count
 */
export const getTopCompanies = async (params = {}) => {
  const { data } = await axios.get('/analytics/top-companies', { params });
  return data;
};

/**
 * Fetch placements/applications weekly/monthly trend points
 */
export const getTrend = async (params = {}) => {
  const { data } = await axios.get('/analytics/trend', { params });
  return data;
};

/**
 * Fetch student disengagement buckets (applications counts per student)
 */
export const getApplicationsPerStudent = async (params = {}) => {
  const { data } = await axios.get('/analytics/applications-per-student', { params });
  return data;
};
