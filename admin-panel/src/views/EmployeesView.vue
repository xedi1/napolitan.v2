<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Employees</h1>
        <p class="text-gray-600">Manage staff and shifts</p>
      </div>
      <button
        @click="showAddModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Add Employee
      </button>
    </div>

    <!-- Employee List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="employee in employees" :key="employee.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">
              {{ employee.firstName }} {{ employee.lastName }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ employee.email }}</td>
            <td class="px-6 py-4 text-sm">
              <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {{ employee.role }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ employee.position || '-' }}</td>
            <td class="px-6 py-4">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getShiftClass(employee.shiftStatus)"
              >
                {{ employee.shiftStatus }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <button
                @click="toggleShift(employee)"
                class="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                {{ employee.shiftStatus === 'OFF' ? 'Start Shift' : 'End Shift' }}
              </button>
              <button
                @click="editEmployee(employee)"
                class="text-gray-600 hover:text-gray-900"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { employeesApi } from '../api';
import type { Employee } from '../api/types';

const employees = ref<Employee[]>([]);
const showAddModal = ref(false);

async function fetchEmployees() {
  try {
    const response = await employeesApi.list();
    employees.value = response.data;
  } catch (error) {
    console.error('Failed to fetch employees:', error);
  }
}

function getShiftClass(status: string) {
  const classes: Record<string, string> = {
    OFF: 'bg-gray-100 text-gray-800',
    ON_DUTY: 'bg-green-100 text-green-800',
    BREAK: 'bg-yellow-100 text-yellow-800',
  };
  return classes[status] || classes.OFF;
}

async function toggleShift(employee: Employee) {
  try {
    const newStatus = employee.shiftStatus === 'OFF' ? 'ON_DUTY' : 'OFF';
    await employeesApi.updateShift(employee.id, newStatus);
    await fetchEmployees();
  } catch (error) {
    console.error('Failed to toggle shift:', error);
  }
}

function editEmployee(employee: Employee) {
  console.log('Edit employee:', employee);
}

onMounted(fetchEmployees);
</script>
