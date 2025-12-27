// utils/searchUtils.ts

import type { HospitalType, ExtendedDoctorType, ExtendedTreatmentType, BranchType, FilterState, FilterKey, CityType, DepartmentType, SpecialtyType, DoctorType, TreatmentType } from '@/types/searchTypes';

export const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null;
  const parts = imageStr.split("/");
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null;
};

export const generateSlug = (name: string | null | undefined): string => {
  return (name ?? '').toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
};

export const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const getVisibleFiltersByView = (view: FilterState['view']): FilterKey[] => {
  switch (view) {
    case "hospitals": return ["branch", "treatment", "city"];
    case "doctors": return ["doctor", "specialization", "treatment", "city"];
    case "treatments": return ["treatment", "city"];
    default: return ["doctor", "city"];
  }
};

export const enforceOnePrimaryFilter = (key: FilterKey, prevFilters: FilterState, newFilterValue: { id: string; query: string }): FilterState => {
  let newFilters = { ...prevFilters, [key]: newFilterValue };
  const primaryKeys: FilterKey[] = ['doctor', 'treatment', 'branch'];

  if (primaryKeys.includes(key as any) && (newFilterValue.id || newFilterValue.query)) {
    primaryKeys.forEach(primaryKey => {
      if (primaryKey !== key) {
        newFilters = { ...newFilters, [primaryKey]: { id: "", query: "" } };
      }
    });

    newFilters = { ...newFilters, department: { id: "", query: "" }, specialization: { id: "", query: "" } };
  }
  return newFilters;
};

export const matchesSpecialization = (specialization: any, id: string, text: string): boolean => {
  if (!specialization) return false;
  const specs = Array.isArray(specialization) ? specialization : [specialization];
  const lowerText = text.toLowerCase();
  return specs.some((spec) => {
    const specId = spec._id || (typeof spec === 'string' ? spec : '');
    const specName = String(spec.name || spec.title || spec.specialty || (typeof spec === 'string' ? spec : ''));
    if (id && specId === id) return true;
    if (lowerText && specName.toLowerCase().includes(lowerText)) return true;
    return false;
  });
};

export const getMatchingBranches = (
  hospitals: HospitalType[],
  filters: FilterState,
  allExtendedTreatments: ExtendedTreatmentType[]
): (BranchType & { hospitalName: string; hospitalLogo: string | null; hospitalId: string })[] => {
  const { city, state, specialization, branch, department, treatment } = filters;
  const lowerCity = city.query.toLowerCase();
  const lowerState = state.query.toLowerCase();
  const lowerSpec = specialization.query.toLowerCase();
  const lowerBranch = branch.query.toLowerCase();
  const lowerDept = department.query.toLowerCase();
  const lowerTreatment = treatment.query.toLowerCase();

  const matchingTreatmentIds = new Set<string>();
  if (treatment.id || lowerTreatment) {
    allExtendedTreatments.forEach(t => {
      const nameMatch = lowerTreatment && (t.name ?? '').toLowerCase().includes(lowerTreatment);
      if ((treatment.id && t._id === treatment.id) || nameMatch) {
        matchingTreatmentIds.add(t._id);
      }
    });
    if ((treatment.id || lowerTreatment) && matchingTreatmentIds.size === 0) return [];
  }

  return hospitals
    .flatMap((h) => h.branches.map((b) => ({ ...b, hospitalName: h.hospitalName, hospitalLogo: h.logo, hospitalId: h._id })))
    .filter((b) => {
      if ((city.id || lowerCity) && !b.city.some((c) => (city.id && c._id === city.id) || (lowerCity && (c.cityName ?? '').toLowerCase().includes(lowerCity)))) return false;
      if ((state.id || lowerState) && !b.city.some((c) => (state.id && c.state === state.id) || (lowerState && (c.state ?? '').toLowerCase().includes(lowerState)))) return false;
      if ((branch.id || lowerBranch) && !(branch.id === b._id) && !(lowerBranch && (b.branchName ?? '').toLowerCase().includes(lowerBranch))) return false;

      if (treatment.id || lowerTreatment) {
        const allBranchTreatmentIds = new Set<string>();
        b.treatments?.forEach(t => allBranchTreatmentIds.add(t._id));
        b.specialists?.forEach(spec => spec.treatments?.forEach(t => allBranchTreatmentIds.add(t._id)));

        let hasMatchingTreatment = false;
        if (matchingTreatmentIds.size > 0) {
          for (const treatmentId of matchingTreatmentIds) {
            if (allBranchTreatmentIds.has(treatmentId)) {
              hasMatchingTreatment = true;
              break;
            }
          }
        }
        if (!hasMatchingTreatment) return false;
      }

      const allDepartments = (b.specialists || []).flatMap(spec => spec.department || []);
      if ((department.id || lowerDept) && !allDepartments.some((d) => (department.id && d._id === department.id) || (lowerDept && (d.name ?? '').toLowerCase().includes(lowerDept)))) return false;

      if (specialization.id || lowerSpec) {
        const hasSpec = b.specialization?.some((s) => (specialization.id && s._id === specialization.id) || (lowerSpec && ((s.name ?? '').toLowerCase().includes(lowerSpec) || (s.title ?? '').toLowerCase().includes(lowerSpec))))
          || b.doctors?.some(d => matchesSpecialization(d.specialization, specialization.id, lowerSpec));
        if (!hasSpec) return false;
      }

      return true;
    });
};

export const getAllExtendedDoctors = (hospitals: HospitalType[]): ExtendedDoctorType[] => {
  const extendedMap = new Map<string, ExtendedDoctorType>();

  hospitals.forEach((h) => {
    const processDoctor = (item: DoctorType, branch?: BranchType) => {
      const baseId = item._id;

      const doctorDepartments: DepartmentType[] = [];
      const specs = Array.isArray(item.specialization) ? item.specialization : item.specialization ? [item.specialization] : [];
      specs.forEach((spec: any) => {
        if (typeof spec === 'object' && spec?.department) {
          spec.department.forEach((dept: DepartmentType) => {
            doctorDepartments.push(dept);
          });
        }
      });
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map(dept => [dept._id, dept])).values());

      const defaultBranch = h.branches[0];
      const location = {
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        branchName: branch?.branchName || defaultBranch?.branchName,
        branchId: branch?._id || defaultBranch?._id,
        cities: branch?.city || defaultBranch?.city || [],
      };

      if (extendedMap.has(baseId)) {
        const existingDoctor = extendedMap.get(baseId)!;

        const isLocationDuplicate = existingDoctor.locations.some(
          loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        );

        if (!isLocationDuplicate) {
          existingDoctor.locations.push(location);
        }

        const allDepts = [...existingDoctor.departments, ...uniqueDepartments];
        existingDoctor.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values());
      } else {
        extendedMap.set(baseId, {
          ...item,
          baseId: baseId,
          locations: [location],
          departments: uniqueDepartments,
        } as ExtendedDoctorType);
      }
    };

    h.doctors.forEach((d) => processDoctor(d));
    h.branches.forEach((b) => {
      b.doctors.forEach((d) => processDoctor(d, b));
    });
  });

  return Array.from(extendedMap.values());
};

export const getAllExtendedTreatments = (hospitals: HospitalType[]): ExtendedTreatmentType[] => {
  const extended = new Map<string, ExtendedTreatmentType>();
  hospitals.forEach((h) => {
    const processTreatment = (item: TreatmentType, branch?: BranchType, departments: DepartmentType[] = []) => {
      const baseId = item._id;
      if (!extended.has(baseId)) {
        extended.set(baseId, {
          ...item,
          cost: item.cost ?? 'Price Varies',
          branchesAvailableAt: [],
          departments: [],
        } as ExtendedTreatmentType);
      }
      const existingTreatment = extended.get(baseId)!;
      const location = {
        branchId: branch?._id,
        branchName: branch?.branchName,
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        cities: branch?.city || [],
        departments: Array.from(new Map(departments.map(dept => [dept._id, dept])).values()),
        cost: item.cost,
      };

      const isLocationDuplicate = existingTreatment.branchesAvailableAt.some(
        loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
      );

      if (!isLocationDuplicate) {
        existingTreatment.branchesAvailableAt.push(location);

        const allDepts = [...existingTreatment.departments, ...departments];
        existingTreatment.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values());
      }
    };

    h.treatments?.forEach((item) => processTreatment(item));
    h.branches.forEach((b) => {
      const branchTreatments = [...(b.treatments || []), ...(b.specialists || []).flatMap(s => s.treatments || [])];
      branchTreatments.forEach((item) => {
        const treatmentDepartments: DepartmentType[] = [];
        b.specialists?.forEach(spec => {
          const hasThisTreatment = spec.treatments?.some(t => t._id === item._id);
          if (hasThisTreatment && spec.department) treatmentDepartments.push(...spec.department);
        });
        processTreatment(item, b, treatmentDepartments);
      });
    });
  });
  return Array.from(extended.values());
};